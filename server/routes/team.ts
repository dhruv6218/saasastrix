import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logActivity } from './activities';
import { sendTeamInviteEmail } from '../services/email';

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
      `SELECT * FROM workspace_invites WHERE workspace_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
      [req.params.wsId]
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

  const validRoles = ['admin', 'maker', 'viewer'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  // Check if already a member
  const existingMember = await query(
    `SELECT u.id FROM users u
     JOIN workspace_members wm ON wm.user_id = u.id
     WHERE u.email = $1 AND wm.workspace_id = $2`,
    [email.toLowerCase(), req.params.wsId]
  );
  if (existingMember.rows.length > 0) {
    return res.status(409).json({ error: 'This person is already a member of this workspace' });
  }

  // Check for existing pending invite
  const existingInvite = await query(
    `SELECT id FROM workspace_invites WHERE email = $1 AND workspace_id = $2 AND status = 'pending'`,
    [email.toLowerCase(), req.params.wsId]
  );
  if (existingInvite.rows.length > 0) {
    return res.status(409).json({ error: 'An invite is already pending for this email' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  await query(
    `INSERT INTO workspace_invites (workspace_id, email, role, token, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
    [req.params.wsId, email.toLowerCase(), role, token]
  );

  // Get workspace name + inviter name for email
  const [wsRes, inviterRes] = await Promise.all([
    query('SELECT name FROM workspaces WHERE id = $1', [req.params.wsId]),
    query('SELECT full_name FROM users WHERE id = $1', [req.user!.id]),
  ]);
  const workspaceName = wsRes.rows[0]?.name || 'your workspace';
  const inviterName = inviterRes.rows[0]?.full_name || 'A teammate';

  // Send email async (don't block response)
  sendTeamInviteEmail(email, inviterName, workspaceName, token, role).catch(() => {});

  await logActivity(req.params.wsId, req.user!.id, 'Invited team member', 'Member', '', `${email} as ${role}`);
  res.status(201).json({ success: true });
});

// DELETE /api/workspaces/:wsId/team/invites/:inviteId — cancel pending invite
router.delete('/invites/:inviteId', requireRole('admin'), async (req: Request, res: Response) => {
  await query(
    `UPDATE workspace_invites SET status = 'expired' WHERE id = $1 AND workspace_id = $2 AND status = 'pending'`,
    [req.params.inviteId, req.params.wsId]
  );
  res.json({ success: true });
});

// DELETE /api/workspaces/:wsId/team/:memberId — remove member
router.delete('/:memberId', requireRole('admin'), async (req: Request, res: Response) => {
  const memberRes = await query(
    'SELECT role, user_id FROM workspace_members WHERE id = $1 AND workspace_id = $2',
    [req.params.memberId, req.params.wsId]
  );
  if (!memberRes.rows[0]) return res.status(404).json({ error: 'Member not found' });
  if (memberRes.rows[0].role === 'owner') {
    return res.status(403).json({ error: 'Cannot remove workspace owner' });
  }
  if (memberRes.rows[0].user_id === req.user!.id) {
    return res.status(403).json({ error: 'Cannot remove yourself' });
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
    `UPDATE workspace_members SET role = $1
     WHERE id = $2 AND workspace_id = $3 AND role != 'owner'
     RETURNING *`,
    [role, req.params.memberId, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Member not found or owner role cannot be changed' });
  res.json(result.rows[0]);
});

export default router;
