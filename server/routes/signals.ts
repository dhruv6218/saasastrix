import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logActivity } from './activities';

const router = Router({ mergeParams: true });
router.use(requireAuth, attachWorkspaceRole);

const createSchema = z.object({
  source_type: z.string().min(1),
  raw_text: z.string().min(1),
  account_id: z.string().uuid().optional().nullable(),
  sentiment_label: z.string().optional().nullable(),
  severity_label: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  product_area: z.string().optional().nullable(),
  normalized_text: z.string().optional().nullable(),
});

// GET /api/workspaces/:wsId/signals
router.get('/', async (req: Request, res: Response) => {
  const { search, severity, sentiment, product_area, account_id, date_from, date_to, page = '1', limit = '25', sort_by = 'created_at', sort_dir = 'desc' } = req.query as any;
  const wsId = req.params.wsId;

  let conditions = ['s.workspace_id = $1'];
  let params: any[] = [wsId];
  let i = 2;

  if (search) { conditions.push(`(s.raw_text ILIKE $${i} OR s.product_area ILIKE $${i} OR a.name ILIKE $${i})`); params.push(`%${search}%`); i++; }
  if (severity) { conditions.push(`s.severity_label = $${i}`); params.push(severity); i++; }
  if (sentiment) { conditions.push(`s.sentiment_label = $${i}`); params.push(sentiment); i++; }
  if (product_area) { conditions.push(`s.product_area = $${i}`); params.push(product_area); i++; }
  if (account_id) { conditions.push(`s.account_id = $${i}`); params.push(account_id); i++; }
  if (date_from) { conditions.push(`s.created_at >= $${i}`); params.push(date_from); i++; }
  if (date_to) { conditions.push(`s.created_at <= $${i}::date + INTERVAL '1 day'`); params.push(date_to); i++; }

  const allowedSort = ['created_at', 'severity_label', 'sentiment_label', 'source_type'];
  const sortCol = allowedSort.includes(sort_by) ? sort_by : 'created_at';
  const sortDir = sort_dir === 'asc' ? 'ASC' : 'DESC';

  const where = conditions.join(' AND ');
  const countRes = await query(
    `SELECT COUNT(*) FROM signals s LEFT JOIN accounts a ON a.id = s.account_id WHERE ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].count);

  const lim = Math.min(parseInt(limit) || 25, 100);
  const offset = (Math.max(parseInt(page) || 1, 1) - 1) * lim;

  const rows = await query(
    `SELECT s.*, a.name as account_name, a.arr as account_arr, a.plan as account_plan
     FROM signals s
     LEFT JOIN accounts a ON a.id = s.account_id
     WHERE ${where}
     ORDER BY s.${sortCol} ${sortDir}
     LIMIT $${i} OFFSET $${i+1}`,
    [...params, lim, offset]
  );

  res.json({
    rows: rows.rows.map(r => ({
      ...r,
      accounts: r.account_name ? { name: r.account_name, arr: r.account_arr, plan: r.account_plan } : null,
    })),
    total,
  });
});

// POST /api/workspaces/:wsId/signals
router.post('/', requireRole('maker'), async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);
  const result = await query(
    `INSERT INTO signals (workspace_id, source_type, raw_text, normalized_text, account_id, sentiment_label, severity_label, category, product_area)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.params.wsId, data.source_type, data.raw_text, data.normalized_text, data.account_id, data.sentiment_label, data.severity_label, data.category, data.product_area]
  );
  const sig = result.rows[0];
  await logActivity(req.params.wsId, req.user!.id, 'Added signal manually', 'Signal', sig.id, data.raw_text.substring(0, 80));
  res.status(201).json(sig);
});

// GET /api/workspaces/:wsId/signals/:id
router.get('/:id', async (req: Request, res: Response) => {
  const result = await query(
    `SELECT s.*, a.name as account_name, a.arr as account_arr, a.plan as account_plan
     FROM signals s LEFT JOIN accounts a ON a.id = s.account_id
     WHERE s.id = $1 AND s.workspace_id = $2`,
    [req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Signal not found' });
  const r = result.rows[0];
  res.json({ ...r, accounts: r.account_name ? { name: r.account_name, arr: r.account_arr, plan: r.account_plan } : null });
});

// PATCH /api/workspaces/:wsId/signals/:id
router.patch('/:id', requireRole('maker'), async (req: Request, res: Response) => {
  const { sentiment_label, severity_label, category, product_area, account_id, normalized_text } = req.body;
  const result = await query(
    `UPDATE signals SET
      sentiment_label = COALESCE($1, sentiment_label),
      severity_label = COALESCE($2, severity_label),
      category = COALESCE($3, category),
      product_area = COALESCE($4, product_area),
      account_id = COALESCE($5, account_id),
      normalized_text = COALESCE($6, normalized_text)
     WHERE id = $7 AND workspace_id = $8 RETURNING *`,
    [sentiment_label, severity_label, category, product_area, account_id, normalized_text, req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Signal not found' });
  await logActivity(req.params.wsId, req.user!.id, 'Updated signal classification', 'Signal', req.params.id, `Severity: ${severity_label || 'unchanged'}`);
  res.json(result.rows[0]);
});

// POST /api/workspaces/:wsId/signals/csv-import — bulk insert
router.post('/csv-import', requireRole('maker'), async (req: Request, res: Response) => {
  const { rows } = req.body as { rows: any[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No rows provided' });
  }
  let inserted = 0;
  for (const row of rows.slice(0, 500)) {
    try {
      await query(
        `INSERT INTO signals (workspace_id, source_type, raw_text, sentiment_label, severity_label, product_area)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.params.wsId, row.source_type || 'CSV', row.raw_text || row.text || '', row.sentiment_label, row.severity_label, row.product_area]
      );
      inserted++;
    } catch {}
  }
  await logActivity(req.params.wsId, req.user!.id, `Imported ${inserted} signals via CSV`, 'Signal', '', `${inserted} rows`);
  res.json({ inserted });
});

export default router;
