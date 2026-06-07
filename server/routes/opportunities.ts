import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router({ mergeParams: true });
router.use(requireAuth, attachWorkspaceRole);

// GET /api/workspaces/:wsId/opportunities
router.get('/', async (req: Request, res: Response) => {
  const { action, min_score, max_score, sort_by = 'opportunity_score', sort_dir = 'desc' } = req.query as any;
  let conditions = ['o.workspace_id = $1'];
  let params: any[] = [req.params.wsId];
  let i = 2;
  if (action) { conditions.push(`o.recommended_action = $${i}`); params.push(action); i++; }
  if (min_score) { conditions.push(`o.opportunity_score >= $${i}`); params.push(Number(min_score)); i++; }
  if (max_score) { conditions.push(`o.opportunity_score <= $${i}`); params.push(Number(max_score)); i++; }

  const allowedSort = ['opportunity_score', 'demand_score', 'pain_score', 'arr_score', 'trend_score'];
  const sortCol = allowedSort.includes(sort_by) ? sort_by : 'opportunity_score';
  const sortDir = sort_dir === 'asc' ? 'ASC' : 'DESC';

  const result = await query(
    `SELECT o.*,
       p.id as problem_id, p.title as problem_title, p.evidence_count, p.affected_arr,
       (
         SELECT json_agg(json_build_object('name', a.name, 'arr', a.arr))
         FROM (
           SELECT DISTINCT a.name, a.arr FROM accounts a
           JOIN signals s ON s.account_id = a.id
           JOIN signal_problems sp ON sp.signal_id = s.id
           WHERE sp.problem_id = p.id
           ORDER BY a.arr DESC
           LIMIT 3
         ) a
       ) as top_accounts
     FROM opportunities o
     JOIN problems p ON p.id = o.problem_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY o.${sortCol} ${sortDir}`,
    params
  );

  res.json(result.rows.map(r => ({
    ...r,
    problems: { id: r.problem_id, title: r.problem_title, evidence_count: r.evidence_count, affected_arr: r.affected_arr },
    top_accounts: r.top_accounts || [],
  })));
});

// GET /api/workspaces/:wsId/opportunities/:id
router.get('/:id', async (req: Request, res: Response) => {
  const result = await query(
    `SELECT o.*,
       p.id as problem_id, p.title as problem_title, p.evidence_count, p.affected_arr, p.description as problem_description
     FROM opportunities o
     JOIN problems p ON p.id = o.problem_id
     WHERE o.id = $1 AND o.workspace_id = $2`,
    [req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Opportunity not found' });
  const r = result.rows[0];
  res.json({
    ...r,
    problems: { id: r.problem_id, title: r.problem_title, evidence_count: r.evidence_count, affected_arr: r.affected_arr },
  });
});

// POST /api/workspaces/:wsId/opportunities — create opportunity for a problem
router.post('/', requireRole('maker'), async (req: Request, res: Response) => {
  const { problem_id, opportunity_score = 0, demand_score = 0, pain_score = 0, arr_score = 0, trend_score = 0, recommended_action } = req.body;
  const result = await query(
    `INSERT INTO opportunities (workspace_id, problem_id, opportunity_score, demand_score, pain_score, arr_score, trend_score, recommended_action)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.params.wsId, problem_id, opportunity_score, demand_score, pain_score, arr_score, trend_score, recommended_action]
  );
  res.status(201).json(result.rows[0]);
});

export default router;
