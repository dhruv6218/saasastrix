import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(requireAuth, attachWorkspaceRole);

export async function logActivity(
  workspaceId: string,
  actorId: string | null,
  action: string,
  objectType: string,
  objectId: string,
  metadata?: string
) {
  try {
    await query(
      'INSERT INTO activities (workspace_id, actor_id, action, object_type, object_id, metadata) VALUES ($1,$2,$3,$4,$5,$6)',
      [workspaceId, actorId, action, objectType, objectId, metadata || null]
    );
  } catch (e) {
    console.error('Activity log error:', e);
  }
}

// GET /api/workspaces/:wsId/activities
router.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await query(
    `SELECT a.*, u.full_name as actor_name, u.avatar_url as actor_avatar
     FROM activities a
     LEFT JOIN users u ON u.id = a.actor_id
     WHERE a.workspace_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.params.wsId, limit, offset]
  );
  res.json(result.rows);
});

export default router;
