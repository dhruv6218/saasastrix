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
  description: z.string().optional().nullable(),
  severity: z.string().optional().nullable(),
  product_area: z.string().optional().nullable(),
});

// GET /api/workspaces/:wsId/problems
router.get('/', async (req: Request, res: Response) => {
  const { search, status, severity, product_area } = req.query as any;
  let conditions = ['p.workspace_id = $1'];
  let params: any[] = [req.params.wsId];
  let i = 2;
  if (search) { conditions.push(`p.title ILIKE $${i}`); params.push(`%${search}%`); i++; }
  if (status) { conditions.push(`p.status = $${i}`); params.push(status); i++; }
  if (severity) { conditions.push(`p.severity = $${i}`); params.push(severity); i++; }
  if (product_area) { conditions.push(`p.product_area = $${i}`); params.push(product_area); i++; }

  const result = await query(
    `SELECT p.*, COUNT(sp.signal_id) as evidence_count
     FROM problems p
     LEFT JOIN signal_problems sp ON sp.problem_id = p.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY p.id
     ORDER BY p.affected_arr DESC, p.created_at DESC`,
    params
  );
  res.json(result.rows);
});

// POST /api/workspaces/:wsId/problems
router.post('/', requireRole('maker'), async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);
  const result = await query(
    `INSERT INTO problems (workspace_id, title, description, severity, product_area)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.wsId, data.title, data.description, data.severity, data.product_area]
  );
  const prob = result.rows[0];
  await logActivity(req.params.wsId, req.user!.id, 'Created problem', 'Problem', prob.id, data.title);
  res.status(201).json(prob);
});

// GET /api/workspaces/:wsId/problems/:id
router.get('/:id', async (req: Request, res: Response) => {
  const [probRes, sigRes, accRes] = await Promise.all([
    query('SELECT * FROM problems WHERE id = $1 AND workspace_id = $2', [req.params.id, req.params.wsId]),
    query(
      `SELECT s.*, a.name as account_name, a.arr as account_arr, a.plan as account_plan
       FROM signals s
       JOIN signal_problems sp ON sp.signal_id = s.id
       LEFT JOIN accounts a ON a.id = s.account_id
       WHERE sp.problem_id = $1`,
      [req.params.id]
    ),
    query(
      `SELECT DISTINCT a.* FROM accounts a
       JOIN signals s ON s.account_id = a.id
       JOIN signal_problems sp ON sp.signal_id = s.id
       WHERE sp.problem_id = $1`,
      [req.params.id]
    ),
  ]);
  if (!probRes.rows[0]) return res.status(404).json({ error: 'Problem not found' });
  res.json({
    problem: probRes.rows[0],
    signals: sigRes.rows.map(r => ({ ...r, accounts: r.account_name ? { name: r.account_name, arr: r.account_arr, plan: r.account_plan } : null })),
    accounts: accRes.rows,
  });
});

// PATCH /api/workspaces/:wsId/problems/:id
router.patch('/:id', requireRole('maker'), async (req: Request, res: Response) => {
  const { title, description, status, severity, trend, product_area, affected_arr } = req.body;
  const result = await query(
    `UPDATE problems SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      status = COALESCE($3, status),
      severity = COALESCE($4, severity),
      trend = COALESCE($5, trend),
      product_area = COALESCE($6, product_area),
      affected_arr = COALESCE($7, affected_arr)
     WHERE id = $8 AND workspace_id = $9 RETURNING *`,
    [title, description, status, severity, trend, product_area, affected_arr, req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Problem not found' });
  res.json(result.rows[0]);
});

// POST /api/workspaces/:wsId/problems/:id/signals/:sid — link signal
router.post('/:id/signals/:sid', requireRole('maker'), async (req: Request, res: Response) => {
  await query('INSERT INTO signal_problems (signal_id, problem_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.sid, req.params.id]);
  await query('UPDATE problems SET evidence_count = (SELECT COUNT(*) FROM signal_problems WHERE problem_id = $1) WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// DELETE /api/workspaces/:wsId/problems/:id/signals/:sid — unlink signal
router.delete('/:id/signals/:sid', requireRole('maker'), async (req: Request, res: Response) => {
  await query('DELETE FROM signal_problems WHERE signal_id = $1 AND problem_id = $2', [req.params.sid, req.params.id]);
  await query('UPDATE problems SET evidence_count = (SELECT COUNT(*) FROM signal_problems WHERE problem_id = $1) WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

export default router;
