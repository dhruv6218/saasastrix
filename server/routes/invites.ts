import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/invites/:token — public, fetch invite details for accept page
router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  try {
    const result = await query(
      `SELECT wi.id, wi.email, wi.role, wi.status, wi.expires_at,
              w.name AS workspace_name, w.id AS workspace_id,
              u.full_name AS inviter_name
       FROM workspace_invites wi
       JOIN workspaces w ON w.id = wi.workspace_id
       LEFT JOIN workspace_members wm ON wm.workspace_id = wi.workspace_id AND wm.role = 'owner'
       LEFT JOIN users u ON u.id = wm.user_id
       WHERE wi.token = $1`,
      [token]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Invite not found or expired' });
    }
    const inv = result.rows[0];
    if (inv.status !== 'pending') {
      return res.status(400).json({ error: inv.status === 'accepted' ? 'This invite has already been accepted.' : 'This invite has expired.' });
    }
    if (new Date(inv.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This invite link has expired. Please ask for a new one.' });
    }
    res.json({
      workspace_name: inv.workspace_name,
      workspace_id: inv.workspace_id,
      inviter_name: inv.inviter_name || 'A teammate',
      email: inv.email,
      role: inv.role,
    });
  } catch (err) {
    console.error('[Invites] GET error:', err);
    res.status(500).json({ error: 'Failed to fetch invite' });
  }
});

// POST /api/invites/:token/accept — requires auth
router.post('/:token/accept', requireAuth, async (req: Request, res: Response) => {
  const { token } = req.params;
  try {
    const invRes = await query(
      `SELECT * FROM workspace_invites WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );
    if (!invRes.rows[0]) {
      return res.status(400).json({ error: 'Invalid or expired invite link' });
    }
    const invite = invRes.rows[0];

    // Allow if email matches OR if invite email matches logged-in user email
    const userRes = await query('SELECT email FROM users WHERE id = $1', [req.user!.id]);
    const userEmail = userRes.rows[0]?.email;
    if (userEmail?.toLowerCase() !== invite.email?.toLowerCase()) {
      return res.status(403).json({ error: `This invite was sent to ${invite.email}. Please sign in with that account.` });
    }

    // Add to workspace
    await query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = $3`,
      [invite.workspace_id, req.user!.id, invite.role]
    );
    await query(`UPDATE workspace_invites SET status = 'accepted' WHERE id = $1`, [invite.id]);

    res.json({ success: true, workspace_id: invite.workspace_id, role: invite.role });
  } catch (err) {
    console.error('[Invites] accept error:', err);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

export default router;
