import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'noreply@astrixai.app';
const APP_URL = process.env.APP_URL || 'https://astrixai.app';

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:#0f0f0f;padding:32px 40px;text-align:center}
  .logo{color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px}
  .logo span{color:#3b82f6}
  .body{padding:40px}
  h1{margin:0 0 12px;font-size:26px;font-weight:700;color:#111;letter-spacing:-0.5px}
  p{margin:0 0 16px;color:#555;font-size:15px;line-height:1.6}
  .btn{display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;margin:8px 0}
  .footer{padding:24px 40px;background:#f8f9fb;border-top:1px solid #eee;text-align:center;color:#999;font-size:12px}
  .divider{border:none;border-top:1px solid #eee;margin:24px 0}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><div class="logo">ASTRIX <span>AI</span></div></div>
  <div class="body">${body}</div>
  <div class="footer">© ${new Date().getFullYear()} Astrix AI · <a href="${APP_URL}/privacy" style="color:#999">Privacy</a> · <a href="${APP_URL}/terms" style="color:#999">Terms</a><br/>astrixai.app</div>
</div>
</body>
</html>`;
}

export async function sendWelcomeEmail(to: string, name: string) {
  const firstName = name.split(' ')[0];
  const html = baseTemplate('Welcome to Astrix AI', `
    <h1>Welcome, ${firstName}! 👋</h1>
    <p>You're in. Astrix turns raw customer signals into evidence-backed product decisions — no more guessing what to build next.</p>
    <p><strong>Your first step:</strong> Create a workspace and upload your first signals.</p>
    <a class="btn" href="${APP_URL}/onboarding/step-1">Set up your workspace →</a>
    <hr class="divider"/>
    <p style="font-size:13px;color:#999">Need help? Reply to this email or visit our <a href="${APP_URL}/contact" style="color:#3b82f6">contact page</a>.</p>
  `);
  try {
    await resend.emails.send({ from: FROM, to, subject: 'Welcome to Astrix AI — let\'s build evidence-backed product', html });
  } catch (err) {
    console.error('[Email] sendWelcomeEmail failed:', err);
  }
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const html = baseTemplate('Reset your Astrix password', `
    <h1>Reset your password</h1>
    <p>Hi ${name.split(' ')[0]},</p>
    <p>We received a request to reset your Astrix AI password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
    <a class="btn" href="${resetUrl}">Reset password →</a>
    <hr class="divider"/>
    <p style="font-size:13px;color:#999">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
    <p style="font-size:12px;color:#bbb;word-break:break-all">Or paste this link: ${resetUrl}</p>
  `);
  try {
    await resend.emails.send({ from: FROM, to, subject: 'Reset your Astrix AI password', html });
  } catch (err) {
    console.error('[Email] sendPasswordResetEmail failed:', err);
  }
}

export async function sendTeamInviteEmail(to: string, inviterName: string, workspaceName: string, token: string, role: string) {
  const inviteUrl = `${APP_URL}/accept-invitation?token=${token}`;
  const html = baseTemplate(`${inviterName} invited you to Astrix AI`, `
    <h1>You're invited!</h1>
    <p><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on Astrix AI as a <strong>${role}</strong>.</p>
    <p>Astrix is the intelligence engine that turns customer signals into evidence-backed product decisions.</p>
    <a class="btn" href="${inviteUrl}">Accept invitation →</a>
    <hr class="divider"/>
    <p style="font-size:13px;color:#999">This invitation expires in 7 days. If you weren't expecting this, you can ignore it.</p>
  `);
  try {
    await resend.emails.send({ from: FROM, to, subject: `${inviterName} invited you to ${workspaceName} on Astrix AI`, html });
  } catch (err) {
    console.error('[Email] sendTeamInviteEmail failed:', err);
  }
}

export async function sendWeeklyDigestEmail(
  to: string,
  name: string,
  workspaceName: string,
  stats: { newSignals: number; openProblems: number; pendingReviews: number; openOpportunities: number }
) {
  const html = baseTemplate(`Your Astrix weekly digest — ${workspaceName}`, `
    <h1>Weekly digest 📊</h1>
    <p>Hi ${name.split(' ')[0]}, here's what happened in <strong>${workspaceName}</strong> this week.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <tr>
        <td style="padding:14px 16px;background:#f0f7ff;border-radius:10px;text-align:center;width:25%">
          <div style="font-size:28px;font-weight:800;color:#3b82f6">${stats.newSignals}</div>
          <div style="font-size:12px;color:#555;margin-top:4px">New Signals</div>
        </td>
        <td style="width:2%"></td>
        <td style="padding:14px 16px;background:#fff7ed;border-radius:10px;text-align:center;width:25%">
          <div style="font-size:28px;font-weight:800;color:#f97316">${stats.openProblems}</div>
          <div style="font-size:12px;color:#555;margin-top:4px">Open Problems</div>
        </td>
        <td style="width:2%"></td>
        <td style="padding:14px 16px;background:#f0fdf4;border-radius:10px;text-align:center;width:25%">
          <div style="font-size:28px;font-weight:800;color:#22c55e">${stats.openOpportunities}</div>
          <div style="font-size:12px;color:#555;margin-top:4px">Opportunities</div>
        </td>
        <td style="width:2%"></td>
        <td style="padding:14px 16px;background:#fdf4ff;border-radius:10px;text-align:center;width:21%">
          <div style="font-size:28px;font-weight:800;color:#a855f7">${stats.pendingReviews}</div>
          <div style="font-size:12px;color:#555;margin-top:4px">Pending Reviews</div>
        </td>
      </tr>
    </table>
    <a class="btn" href="${APP_URL}/app">Open Dashboard →</a>
  `);
  try {
    await resend.emails.send({ from: FROM, to, subject: `Your Astrix weekly digest — ${workspaceName}`, html });
  } catch (err) {
    console.error('[Email] sendWeeklyDigestEmail failed:', err);
  }
}
