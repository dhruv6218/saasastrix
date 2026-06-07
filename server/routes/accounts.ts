import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router({ mergeParams: true });
router.use(requireAuth, attachWorkspaceRole);

const createSchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional().nullable(),
  arr: z.number().default(0),
  plan: z.string().optional().nullable(),
  health_score: z.string().optional().nullable(),
  renewal_date: z.string().optional().nullable(),
});

// GET /api/workspaces/:wsId/accounts
router.get('/', async (req: Request, res: Response) => {
  const { search, plan, arr_min, arr_max, health, page = '1', limit = '25', sort_by = 'arr', sort_dir = 'desc' } = req.query as any;
  const wsId = req.params.wsId;

  let conditions = ['a.workspace_id = $1'];
  let params: any[] = [wsId];
  let i = 2;

  if (search) { conditions.push(`(a.name ILIKE $${i} OR a.domain ILIKE $${i})`); params.push(`%${search}%`); i++; }
  if (plan) { conditions.push(`a.plan = $${i}`); params.push(plan); i++; }
  if (arr_min) { conditions.push(`a.arr >= $${i}`); params.push(Number(arr_min)); i++; }
  if (arr_max) { conditions.push(`a.arr <= $${i}`); params.push(Number(arr_max)); i++; }
  if (health === 'healthy') { conditions.push(`(a.health_score::int) >= 75`); }
  else if (health === 'warning') { conditions.push(`(a.health_score::int) >= 50 AND (a.health_score::int) < 75`); }
  else if (health === 'at_risk') { conditions.push(`(a.health_score::int) < 50 AND (a.health_score::int) > 0`); }

  const allowedSort = ['name', 'arr', 'health_score', 'created_at'];
  const sortCol = allowedSort.includes(sort_by) ? sort_by : 'arr';
  const sortDir = sort_dir === 'asc' ? 'ASC' : 'DESC';
  const where = conditions.join(' AND ');

  const countRes = await query(`SELECT COUNT(*) FROM accounts a WHERE ${where}`, params);
  const total = parseInt(countRes.rows[0].count);

  const lim = Math.min(parseInt(limit) || 25, 100);
  const offset = (Math.max(parseInt(page) || 1, 1) - 1) * lim;

  const rows = await query(
    `SELECT a.*, COUNT(s.id) as signal_count
     FROM accounts a
     LEFT JOIN signals s ON s.account_id = a.id
     WHERE ${where}
     GROUP BY a.id
     ORDER BY a.${sortCol} ${sortDir}
     LIMIT $${i} OFFSET $${i+1}`,
    [...params, lim, offset]
  );
  res.json({ rows: rows.rows, total });
});

// POST /api/workspaces/:wsId/accounts
router.post('/', requireRole('maker'), async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);
  const result = await query(
    `INSERT INTO accounts (workspace_id, name, domain, arr, plan, health_score, renewal_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.params.wsId, data.name, data.domain, data.arr, data.plan, data.health_score, data.renewal_date]
  );
  res.status(201).json(result.rows[0]);
});

// GET /api/workspaces/:wsId/accounts/:id
router.get('/:id', async (req: Request, res: Response) => {
  const [accRes, sigRes, probRes] = await Promise.all([
    query('SELECT * FROM accounts WHERE id = $1 AND workspace_id = $2', [req.params.id, req.params.wsId]),
    query('SELECT * FROM signals WHERE account_id = $1 ORDER BY created_at DESC LIMIT 20', [req.params.id]),
    query(
      `SELECT DISTINCT p.* FROM problems p
       JOIN signal_problems sp ON sp.problem_id = p.id
       JOIN signals s ON s.id = sp.signal_id
       WHERE s.account_id = $1 AND p.workspace_id = $2`,
      [req.params.id, req.params.wsId]
    ),
  ]);
  if (!accRes.rows[0]) return res.status(404).json({ error: 'Account not found' });
  res.json({ account: accRes.rows[0], signals: sigRes.rows, problems: probRes.rows });
});

// PATCH /api/workspaces/:wsId/accounts/:id
router.patch('/:id', requireRole('maker'), async (req: Request, res: Response) => {
  const { name, domain, arr, plan, health_score, renewal_date } = req.body;
  const result = await query(
    `UPDATE accounts SET
      name = COALESCE($1, name),
      domain = COALESCE($2, domain),
      arr = COALESCE($3, arr),
      plan = COALESCE($4, plan),
      health_score = COALESCE($5, health_score),
      renewal_date = COALESCE($6, renewal_date)
     WHERE id = $7 AND workspace_id = $8 RETURNING *`,
    [name, domain, arr, plan, health_score, renewal_date, req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Account not found' });
  res.json(result.rows[0]);
});

export default router;
