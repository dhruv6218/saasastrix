import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logActivity } from './activities';

const router = Router({ mergeParams: true });
router.use(requireAuth, attachWorkspaceRole);

const createSchema = z.object({
  title: z.string().min(1),
  action: z.enum(['Build', 'Defer', 'Reject', 'Monitor', 'Investigate']),
  rationale: z.string().optional().nullable(),
  opportunity_id: z.string().uuid().optional().nullable(),
  problem_id: z.string().uuid().optional().nullable(),
  assumptions: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  alternatives: z.array(z.string()).optional(),
});

// GET /api/workspaces/:wsId/decisions
router.get('/', async (req: Request, res: Response) => {
  const { search, action, page = '1', limit = '25' } = req.query as any;
  let conditions = ['d.workspace_id = $1'];
  let params: any[] = [req.params.wsId];
  let i = 2;
  if (search) { conditions.push(`d.title ILIKE $${i}`); params.push(`%${search}%`); i++; }
  if (action) { conditions.push(`d.action = $${i}`); params.push(action); i++; }

  const lim = Math.min(parseInt(limit) || 25, 100);
  const offset = (Math.max(parseInt(page) || 1, 1) - 1) * lim;
  const where = conditions.join(' AND ');

  const countRes = await query(`SELECT COUNT(*) FROM decisions d WHERE ${where}`, params);
  const total = parseInt(countRes.rows[0].count);

  const result = await query(
    `SELECT d.*, u.full_name as author_name
     FROM decisions d
     LEFT JOIN users u ON u.id = d.author_id
     WHERE ${where}
     ORDER BY d.created_at DESC
     LIMIT $${i} OFFSET $${i+1}`,
    [...params, lim, offset]
  );

  res.json({
    rows: result.rows.map(r => ({ ...r, users: r.author_name ? { full_name: r.author_name } : null })),
    total,
  });
});

// POST /api/workspaces/:wsId/decisions
router.post('/', requireRole('maker'), async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);
  const result = await query(
    `INSERT INTO decisions (workspace_id, title, action, rationale, author_id, opportunity_id, problem_id, assumptions, risks, alternatives)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.params.wsId, data.title, data.action, data.rationale, req.user!.id, data.opportunity_id, data.problem_id, data.assumptions || [], data.risks || [], data.alternatives || []]
  );
  const dec = result.rows[0];
  await logActivity(req.params.wsId, req.user!.id, 'Committed decision', 'Decision', dec.id, `${data.action} · ${data.title}`);
  res.status(201).json(dec);
});

// GET /api/workspaces/:wsId/decisions/:id
router.get('/:id', async (req: Request, res: Response) => {
  const result = await query(
    `SELECT d.*, u.full_name as author_name
     FROM decisions d
     LEFT JOIN users u ON u.id = d.author_id
     WHERE d.id = $1 AND d.workspace_id = $2`,
    [req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Decision not found' });
  const r = result.rows[0];
  res.json({ ...r, users: r.author_name ? { full_name: r.author_name } : null });
});

// PATCH /api/workspaces/:wsId/decisions/:id
router.patch('/:id', requireRole('maker'), async (req: Request, res: Response) => {
  const { title, action, rationale, assumptions, risks, alternatives } = req.body;
  const result = await query(
    `UPDATE decisions SET
      title = COALESCE($1, title),
      action = COALESCE($2, action),
      rationale = COALESCE($3, rationale),
      assumptions = COALESCE($4, assumptions),
      risks = COALESCE($5, risks),
      alternatives = COALESCE($6, alternatives)
     WHERE id = $7 AND workspace_id = $8 RETURNING *`,
    [title, action, rationale, assumptions, risks, alternatives, req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Decision not found' });
  res.json(result.rows[0]);
});

export default router;
