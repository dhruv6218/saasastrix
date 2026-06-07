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
  type: z.enum(['PRD', 'Decision Memo', 'Brief', 'Spec', 'Other']),
  content: z.string().default(''),
  external_url: z.string().optional().nullable(),
  external_id: z.string().optional().nullable(),
});

// GET /api/workspaces/:wsId/artifacts
router.get('/', async (req: Request, res: Response) => {
  const result = await query(
    `SELECT art.*, u.full_name as author_name, d.title as decision_title
     FROM artifacts art
     LEFT JOIN users u ON u.id = art.author_id
     LEFT JOIN decisions d ON d.id = art.decision_id
     WHERE art.workspace_id = $1
     ORDER BY art.updated_at DESC`,
    [req.params.wsId]
  );
  res.json(result.rows.map(r => ({
    ...r,
    users: r.author_name ? { full_name: r.author_name } : null,
    decisions: r.decision_title ? { title: r.decision_title } : null,
  })));
});

// POST /api/workspaces/:wsId/artifacts
router.post('/', requireRole('maker'), async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);
  const result = await query(
    `INSERT INTO artifacts (workspace_id, decision_id, title, type, content, author_id, external_url, external_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.params.wsId, data.decision_id, data.title, data.type, data.content, req.user!.id, data.external_url, data.external_id]
  );
  const art = result.rows[0];
  await logActivity(req.params.wsId, req.user!.id, 'Generated artifact', 'Artifact', art.id, `${data.type}: ${data.title}`);
  res.status(201).json(art);
});

// GET /api/workspaces/:wsId/artifacts/:id
router.get('/:id', async (req: Request, res: Response) => {
  const result = await query(
    `SELECT art.*, u.full_name as author_name, d.title as decision_title
     FROM artifacts art
     LEFT JOIN users u ON u.id = art.author_id
     LEFT JOIN decisions d ON d.id = art.decision_id
     WHERE art.id = $1 AND art.workspace_id = $2`,
    [req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Artifact not found' });
  const r = result.rows[0];
  res.json({ ...r, users: r.author_name ? { full_name: r.author_name } : null, decisions: r.decision_title ? { title: r.decision_title } : null });
});

// PATCH /api/workspaces/:wsId/artifacts/:id
router.patch('/:id', requireRole('maker'), async (req: Request, res: Response) => {
  const { title, content, external_url, external_id } = req.body;
  const result = await query(
    `UPDATE artifacts SET
      title = COALESCE($1, title),
      content = COALESCE($2, content),
      external_url = COALESCE($3, external_url),
      external_id = COALESCE($4, external_id),
      version = version + 1,
      updated_at = NOW()
     WHERE id = $5 AND workspace_id = $6 RETURNING *`,
    [title, content, external_url, external_id, req.params.id, req.params.wsId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Artifact not found' });
  res.json(result.rows[0]);
});

export default router;
