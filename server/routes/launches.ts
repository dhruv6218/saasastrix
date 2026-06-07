import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logActivity } from './activities';

const router = Router({ mergeParams: true });
router.use(requireAuth, attachWorkspaceRole);

const createSchema = z.object({
  decision_id: z.string().uuid(),
  title: z.string().min(1),
  action: z.string().optional().nullable(),
  expected_outcome: z.string().optional().nullable(),
  before_count: z.number().optional().nullable(),
  launched_at: z.string().optional().nullable(),
});

// GET /api/workspaces/:wsId/launches
router.get('/', async (req: Request, res: Response) => {
  const result = await query(
    `SELECT l.*, u.full_name as creator_name
     FROM launches l
     LEFT JOIN users u ON u.id = l.created_by
     WHERE l.workspace_id = $1
     ORDER BY l.launched_at DESC`,
    [req.params.wsId]
  );
  res.json(result.rows);
});

// POST /api/workspaces/:wsId/launches
router.post('/', requireRole('maker'), async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);
  const result = await query(
    `INSERT INTO launches (workspace_id, decision_id, title, action, expected_outcome, before_count, launched_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.params.wsId, data.decision_id, data.title, data.action, data.expected_outcome, data.before_count, data.launched_at || new Date().toISOString(), req.user!.id]
  );
  const launch = result.rows[0];
  await logActivity(req.params.wsId, req.user!.id, 'Logged launch', 'Launch', launch.id, data.title);
  res.status(201).json(launch);
});

// GET /api/workspaces/:wsId/launches/:id
router.get('/:id', async (req: Request, res: Response) => {
  const result = await query(
    'SELECT * FROM launches WHERE id = $1 AND workspace_id = $2',
    [req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Launch not found' });
  res.json(result.rows[0]);
});

// PATCH /api/workspaces/:wsId/launches/:id
router.patch('/:id', requireRole('maker'), async (req: Request, res: Response) => {
  const { status, after_count, pm_verdict, notes, expected_outcome } = req.body;
  const result = await query(
    `UPDATE launches SET
      status = COALESCE($1, status),
      after_count = COALESCE($2, after_count),
      pm_verdict = COALESCE($3, pm_verdict),
      notes = COALESCE($4, notes),
      expected_outcome = COALESCE($5, expected_outcome)
     WHERE id = $6 AND workspace_id = $7 RETURNING *`,
    [status, after_count, pm_verdict, notes, expected_outcome, req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Launch not found' });
  if (pm_verdict) {
    await logActivity(req.params.wsId, req.user!.id, `Submitted verdict: ${pm_verdict}`, 'Launch', req.params.id, pm_verdict);
  }
  res.json(result.rows[0]);
});

export default router;
