import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { requireAuth, attachWorkspaceRole } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router({ mergeParams: true });

const DODO_API_BASE = process.env.DODO_API_BASE || 'https://api.dodopayments.com';
const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY || '';

const PLAN_PRODUCTS: Record<string, Record<string, string>> = {
  starter: {
    monthly: process.env.DODO_STARTER_MONTHLY_ID || '',
    annual: process.env.DODO_STARTER_ANNUAL_ID || '',
  },
  growth: {
    monthly: process.env.DODO_GROWTH_MONTHLY_ID || '',
    annual: process.env.DODO_GROWTH_ANNUAL_ID || '',
  },
  scale: {
    monthly: process.env.DODO_SCALE_MONTHLY_ID || '',
    annual: process.env.DODO_SCALE_ANNUAL_ID || '',
  },
};

async function dodoRequest(path: string, method = 'GET', body?: any) {
  const res = await fetch(`${DODO_API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${DODO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw Object.assign(new Error(`Dodo API error: ${err}`), { status: res.status });
  }
  return res.json();
}

// POST /api/workspaces/:wsId/billing/checkout
router.post('/:wsId/checkout', requireAuth, attachWorkspaceRole, requireRole('owner'), async (req: Request, res: Response) => {
  const { plan, billing_period = 'monthly' } = req.body;
  const productId = PLAN_PRODUCTS[plan]?.[billing_period];
  if (!productId) return res.status(400).json({ error: 'Invalid plan or billing period' });

  const wsRes = await query('SELECT * FROM workspaces WHERE id = $1', [req.params.wsId]);
  const ws = wsRes.rows[0];
  const userRes = await query('SELECT email, full_name FROM users WHERE id = $1', [req.user!.id]);
  const user = userRes.rows[0];

  const appUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:5000';

  const session = await dodoRequest('/subscriptions', 'POST', {
    product_id: productId,
    quantity: 1,
    payment_link: true,
    customer: {
      email: user.email,
      name: user.full_name,
    },
    metadata: {
      workspace_id: req.params.wsId,
      user_id: req.user!.id,
      plan,
      billing_period,
    },
    return_url: `${appUrl}/app/settings?billing=success`,
  });

  res.json({ url: session.payment_link || session.checkout_url });
});

// GET /api/workspaces/:wsId/billing/status
router.get('/:wsId/status', requireAuth, attachWorkspaceRole, async (req: Request, res: Response) => {
  const result = await query('SELECT plan, dodo_subscription_id FROM workspaces WHERE id = $1', [req.params.wsId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Workspace not found' });
  res.json(result.rows[0]);
});

// POST /api/billing/webhook — Dodo Payments webhook
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['webhook-signature'] as string || req.headers['x-dodo-signature'] as string;
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET || '';

  if (webhookSecret && signature) {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    const sigValue = signature.startsWith('sha256=') ? signature.slice(7) : signature;
    if (!crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sigValue, 'hex'))) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
  }

  const event = req.body;
  const wsId = event?.metadata?.workspace_id || event?.data?.metadata?.workspace_id;

  try {
    switch (event.type) {
      case 'subscription.active':
      case 'payment.succeeded': {
        const plan = event?.metadata?.plan || event?.data?.metadata?.plan || 'starter';
        const subId = event?.data?.id || event?.id;
        if (wsId) {
          await query(
            'UPDATE workspaces SET plan = $1, dodo_subscription_id = $2 WHERE id = $3',
            [plan, subId, wsId]
          );
        }
        break;
      }
      case 'subscription.cancelled':
      case 'subscription.expired': {
        if (wsId) {
          await query('UPDATE workspaces SET plan = $1 WHERE id = $2', ['free', wsId]);
        }
        break;
      }
      case 'subscription.on_hold':
      case 'payment.failed': {
        console.log('Payment failed for workspace:', wsId);
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
