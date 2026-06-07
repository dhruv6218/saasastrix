import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logActivity } from './activities';

const router = Router({ mergeParams: true });
router.use(requireAuth, attachWorkspaceRole);

// GET /api/workspaces/:wsId/team
router.get('/', async (req: Request, res: Response) => {
  const [membersRes, invitesRes] = await Promise.all([
    query(
      `SELECT wm.*, u.full_name, u.email, u.avatar_url
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = $1
       ORDER BY wm.created_at ASC`,
      [req.params.wsId]
    ),
    query(
      'SELECT * FROM workspace_invites WHERE workspace_id = $1 AND status = $2 ORDER BY created_at DESC',
      [req.params.wsId, 'pending']
    ),
  ]);

  res.json({
    members: membersRes.rows.map(r => ({
      ...r,
      users: { full_name: r.full_name, email: r.email, avatar_url: r.avatar_url },
    })),
    invites: invitesRes.rows,
  });
});

// POST /api/workspaces/:wsId/team/invite
router.post('/invite', requireRole('admin'), async (req: Request, res: Response) => {
  const { email, role = 'maker' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const token = crypto.randomBytes(32).toString('hex');
  await query(
    `INSERT INTO workspace_invites (workspace_id, email, role, token)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT DO NOTHING`,
    [req.params.wsId, email.toLowerCase(), role, token]
  );
  await logActivity(req.params.wsId, req.user!.id, 'Invited team member', 'Member', '', `${email} as ${role}`);
  res.status(201).json({ success: true, token });
});

// POST /api/invites/:token/accept — accept invite (no wsId needed)
router.post('/invites/:token/accept', async (req: Request, res: Response) => {
  const { token } = req.params;
  const inv = await query(
    'SELECT * FROM workspace_invites WHERE token = $1 AND status = $2 AND expires_at > NOW()',
    [token, 'pending']
  );
  if (!inv.rows[0]) return res.status(400).json({ error: 'Invalid or expired invite' });
  const invite = inv.rows[0];

  await query(
    `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1,$2,$3)
     ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = $3`,
    [invite.workspace_id, req.user!.id, invite.role]
  );
  await query('UPDATE workspace_invites SET status = $1 WHERE id = $2', ['accepted', invite.id]);
  res.json({ workspace_id: invite.workspace_id, role: invite.role });
});

// DELETE /api/workspaces/:wsId/team/:memberId
router.delete('/:memberId', requireRole('admin'), async (req: Request, res: Response) => {
  const memberRes = await query(
    'SELECT role FROM workspace_members WHERE id = $1 AND workspace_id = $2',
    [req.params.memberId, req.params.wsId]
  );
  if (!memberRes.rows[0]) return res.status(404).json({ error: 'Member not found' });
  if (memberRes.rows[0].role === 'owner') {
    return res.status(403).json({ error: 'Cannot remove workspace owner' });
  }
  await query('DELETE FROM workspace_members WHERE id = $1 AND workspace_id = $2', [req.params.memberId, req.params.wsId]);
  await logActivity(req.params.wsId, req.user!.id, 'Removed team member', 'Member', req.params.memberId, '');
  res.json({ success: true });
});

// PATCH /api/workspaces/:wsId/team/:memberId — change role
router.patch('/:memberId', requireRole('admin'), async (req: Request, res: Response) => {
  const { role } = req.body;
  const valid = ['admin', 'maker', 'viewer'];
  if (!valid.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const result = await query(
    'UPDATE workspace_members SET role = $1 WHERE id = $2 AND workspace_id = $3 AND role != $4 RETURNING *',
    [role, req.params.memberId, req.params.wsId, 'owner']
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Member not found or owner cannot be changed' });
  res.json(result.rows[0]);
});

export default router;
