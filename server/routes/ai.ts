import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { aiLimiter } from '../middleware/rateLimit';
import { logActivity } from './activities';

const router = Router({ mergeParams: true });
router.use(requireAuth, attachWorkspaceRole);

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json() as any;
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// POST /api/workspaces/:wsId/ai/generate-artifact
router.post('/generate-artifact', aiLimiter, requireRole('maker'), async (req: Request, res: Response) => {
  const { decision_id, artifact_type = 'PRD' } = req.body;

  const decRes = await query(
    `SELECT d.*, p.title as problem_title, p.description as problem_desc,
            p.affected_arr, p.evidence_count
     FROM decisions d
     LEFT JOIN problems p ON p.id = d.problem_id
     WHERE d.id = $1 AND d.workspace_id = $2`,
    [decision_id, req.params.wsId]
  );

  if (!decRes.rows[0]) return res.status(404).json({ error: 'Decision not found' });
  const dec = decRes.rows[0];

  const signalsRes = await query(
    `SELECT s.raw_text FROM signals s
     JOIN signal_problems sp ON sp.signal_id = s.id
     WHERE sp.problem_id = $1
     LIMIT 5`,
    [dec.problem_id]
  );
  const evidence = signalsRes.rows.map(r => `- ${r.raw_text}`).join('\n');

  const prompt = artifact_type === 'PRD'
    ? `You are a senior product manager. Write a concise Product Requirements Document (PRD) in Markdown format.

**Decision:** ${dec.title}
**Action:** ${dec.action}
**Rationale:** ${dec.rationale || 'Not specified'}
**Problem:** ${dec.problem_title || 'N/A'}
**Problem Description:** ${dec.problem_desc || 'N/A'}
**Affected ARR:** $${(dec.affected_arr || 0).toLocaleString()}
**Evidence count:** ${dec.evidence_count || 0} signals
**Sample customer feedback:**
${evidence || 'No evidence linked'}
**Assumptions:** ${(dec.assumptions || []).join(', ') || 'None'}
**Risks:** ${(dec.risks || []).join(', ') || 'None'}

Write a professional PRD with these sections: ## Overview, ## Problem Statement, ## Goals & Success Metrics, ## User Stories, ## Functional Requirements, ## Non-Functional Requirements, ## Out of Scope, ## Timeline & Milestones. Keep it concise and evidence-based.`
    : `You are a senior product manager. Write a concise Decision Memo in Markdown format.

**Decision:** ${dec.title}
**Action chosen:** ${dec.action}
**Rationale:** ${dec.rationale || 'Not specified'}
**Assumptions:** ${(dec.assumptions || []).join(', ') || 'None'}
**Risks:** ${(dec.risks || []).join(', ') || 'None'}
**Alternatives considered:** ${(dec.alternatives || []).join(', ') || 'None'}

Write a professional decision memo with: ## Executive Summary, ## Context & Problem, ## Decision & Rationale, ## Alternatives Considered, ## Risks & Mitigations, ## Next Steps.`;

  try {
    const content = await callGemini(prompt);
    await logActivity(req.params.wsId, req.user!.id, `Generated ${artifact_type} via AI`, 'Artifact', decision_id, dec.title);
    res.json({ content, artifact_type });
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'AI generation failed' });
  }
});

// POST /api/workspaces/:wsId/ai/suggest-classification
router.post('/suggest-classification', aiLimiter, requireRole('maker'), async (req: Request, res: Response) => {
  const { raw_text } = req.body;
  if (!raw_text) return res.status(400).json({ error: 'raw_text required' });

  const wsRes = await query('SELECT product_areas FROM workspaces WHERE id = $1', [req.params.wsId]);
  const areas = wsRes.rows[0]?.product_areas || [];

  const prompt = `Analyze this customer feedback and classify it. Available product areas: ${areas.join(', ')}.

Feedback: "${raw_text}"

Respond in JSON only (no markdown):
{
  "sentiment_label": "Positive" | "Neutral" | "Negative",
  "severity_label": "Critical" | "High" | "Medium" | "Low",
  "category": "Bug" | "Feature Request" | "UX Feedback" | "Performance" | "Other",
  "product_area": one of the available product areas or "General",
  "normalized_text": a clean 1-2 sentence summary
}`;

  try {
    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Classification failed' });
  }
});

export default router;
