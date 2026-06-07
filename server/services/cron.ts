import cron from 'node-cron';
import { query } from '../db';
import { sendWeeklyDigestEmail } from './email';

// Aggregate dashboard stats into workspace_stats table (upsert)
async function aggregateDashboardStats() {
  try {
    await query(`
      INSERT INTO workspace_stats (workspace_id, stat_date,
        total_signals, total_accounts, total_problems,
        total_opportunities, total_decisions, total_launches,
        open_problems, pending_reviews)
      SELECT
        w.id AS workspace_id,
        CURRENT_DATE AS stat_date,
        (SELECT COUNT(*) FROM signals WHERE workspace_id = w.id) AS total_signals,
        (SELECT COUNT(*) FROM accounts WHERE workspace_id = w.id) AS total_accounts,
        (SELECT COUNT(*) FROM problems WHERE workspace_id = w.id) AS total_problems,
        (SELECT COUNT(*) FROM opportunities WHERE workspace_id = w.id) AS total_opportunities,
        (SELECT COUNT(*) FROM decisions WHERE workspace_id = w.id) AS total_decisions,
        (SELECT COUNT(*) FROM launches WHERE workspace_id = w.id) AS total_launches,
        (SELECT COUNT(*) FROM problems WHERE workspace_id = w.id AND status NOT IN ('resolved','closed')) AS open_problems,
        (SELECT COUNT(*) FROM launches WHERE workspace_id = w.id AND status = 'active') AS pending_reviews
      FROM workspaces w
      ON CONFLICT (workspace_id, stat_date) DO UPDATE SET
        total_signals = EXCLUDED.total_signals,
        total_accounts = EXCLUDED.total_accounts,
        total_problems = EXCLUDED.total_problems,
        total_opportunities = EXCLUDED.total_opportunities,
        total_decisions = EXCLUDED.total_decisions,
        total_launches = EXCLUDED.total_launches,
        open_problems = EXCLUDED.open_problems,
        pending_reviews = EXCLUDED.pending_reviews,
        updated_at = NOW()
    `);
    console.log('[Cron] Dashboard stats aggregated:', new Date().toISOString());
  } catch (err) {
    console.error('[Cron] aggregateDashboardStats error:', err);
  }
}

// Clean up expired password reset tokens
async function cleanExpiredTokens() {
  try {
    const result = await query(
      `DELETE FROM password_reset_tokens WHERE expires_at < NOW()`
    );
    if (result.rowCount && result.rowCount > 0) {
      console.log(`[Cron] Cleaned ${result.rowCount} expired reset tokens`);
    }
  } catch (err) {
    console.error('[Cron] cleanExpiredTokens error:', err);
  }
}

// Clean up expired workspace invites
async function cleanExpiredInvites() {
  try {
    await query(
      `UPDATE workspace_invites SET status = 'expired'
       WHERE status = 'pending' AND expires_at < NOW()`
    );
  } catch (err) {
    console.error('[Cron] cleanExpiredInvites error:', err);
  }
}

// Send weekly digest emails to Growth/Scale workspaces
async function sendWeeklyDigests() {
  try {
    const workspaces = await query(`
      SELECT w.id, w.name, w.plan
      FROM workspaces w
      WHERE w.plan IN ('growth', 'scale')
    `);

    for (const ws of workspaces.rows) {
      // Get workspace owner
      const ownerRes = await query(`
        SELECT u.email, u.full_name
        FROM users u
        JOIN workspace_members wm ON wm.user_id = u.id
        WHERE wm.workspace_id = $1 AND wm.role = 'owner'
        LIMIT 1
      `, [ws.id]);

      if (!ownerRes.rows[0]) continue;
      const owner = ownerRes.rows[0];

      // Get weekly stats
      const statsRes = await query(`
        SELECT
          (SELECT COUNT(*) FROM signals WHERE workspace_id = $1 AND created_at > NOW() - INTERVAL '7 days') AS new_signals,
          (SELECT COUNT(*) FROM problems WHERE workspace_id = $1 AND status NOT IN ('resolved','closed')) AS open_problems,
          (SELECT COUNT(*) FROM launches WHERE workspace_id = $1 AND status = 'active') AS pending_reviews,
          (SELECT COUNT(*) FROM opportunities WHERE workspace_id = $1) AS open_opportunities
      `, [ws.id]);

      const s = statsRes.rows[0];
      await sendWeeklyDigestEmail(owner.email, owner.full_name, ws.name, {
        newSignals: parseInt(s.new_signals) || 0,
        openProblems: parseInt(s.open_problems) || 0,
        pendingReviews: parseInt(s.pending_reviews) || 0,
        openOpportunities: parseInt(s.open_opportunities) || 0,
      });
    }
    console.log('[Cron] Weekly digests sent:', new Date().toISOString());
  } catch (err) {
    console.error('[Cron] sendWeeklyDigests error:', err);
  }
}

export function startCronJobs() {
  // Every 15 minutes — aggregate dashboard stats
  cron.schedule('*/15 * * * *', aggregateDashboardStats);

  // Every hour — clean expired tokens + invites
  cron.schedule('0 * * * *', cleanExpiredTokens);
  cron.schedule('30 * * * *', cleanExpiredInvites);

  // Every Monday 8am UTC — send weekly digests
  cron.schedule('0 8 * * 1', sendWeeklyDigests);

  // Run aggregation immediately on startup
  aggregateDashboardStats();

  console.log('[Cron] Jobs scheduled: stats every 15min, cleanup hourly, digest Mondays 8am UTC');
}
