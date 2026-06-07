import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logActivity } from './activities';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(1).max(255),
  timezone: z.string().optional(),
});

// GET /api/workspaces — list user's workspaces
router.get('/', async (req: Request, res: Response) => {
  const result = await query(
    `SELECT w.*, wm.role FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = $1
     ORDER BY w.created_at ASC`,
    [req.user!.id]
  );
  res.json(result.rows);
});

// POST /api/workspaces — create workspace
router.post('/', async (req: Request, res: Response) => {
  const { name, timezone } = createSchema.parse(req.body);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  const wsResult = await query(
    'INSERT INTO workspaces (name, slug, timezone) VALUES ($1, $2, $3) RETURNING *',
    [name, slug, timezone || 'UTC']
  );
  const ws = wsResult.rows[0];
  await query(
    'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
    [ws.id, req.user!.id, 'owner']
  );
  res.status(201).json(ws);
});

// GET /api/workspaces/:wsId
router.get('/:wsId', requireAuth, attachWorkspaceRole, async (req: Request, res: Response) => {
  const result = await query('SELECT * FROM workspaces WHERE id = $1', [req.params.wsId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Workspace not found' });
  res.json({ ...result.rows[0], role: req.workspaceRole });
});

// PATCH /api/workspaces/:wsId — update workspace settings
router.patch('/:wsId', attachWorkspaceRole, requireRole('admin'), async (req: Request, res: Response) => {
  const { name, timezone, logo_url, product_areas, segments } = req.body;
  const result = await query(
    `UPDATE workspaces SET
      name = COALESCE($1, name),
      timezone = COALESCE($2, timezone),
      logo_url = COALESCE($3, logo_url),
      product_areas = COALESCE($4, product_areas),
      segments = COALESCE($5, segments)
     WHERE id = $6 RETURNING *`,
    [name, timezone, logo_url, product_areas, segments, req.params.wsId]
  );
  res.json(result.rows[0]);
});

export default router;
