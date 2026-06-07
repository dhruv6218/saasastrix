import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { query } from '../db';
import { signToken, requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/signup', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = signupSchema.parse(req.body);
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, is_admin',
      [email.toLowerCase(), password_hash, full_name]
    );
    const user = result.rows[0];
    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    // Send welcome email async (don't await — don't block response)
    sendWelcomeEmail(user.email, user.full_name).catch(() => {});
    res.status(201).json({ user, token });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    throw err;
  }
});

router.post('/signin', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = signinSchema.parse(req.body);
    const result = await query(
      'SELECT id, email, full_name, password_hash, is_admin FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    const { password_hash, ...safeUser } = user;
    const token = signToken(safeUser);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: safeUser, token });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    throw err;
  }
});

router.post('/signout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true });
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const result = await query(
    'SELECT id, email, full_name, avatar_url, is_admin, created_at FROM users WHERE id = $1',
    [req.user!.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  const { full_name, avatar_url } = req.body;
  const result = await query(
    'UPDATE users SET full_name = COALESCE($1, full_name), avatar_url = COALESCE($2, avatar_url) WHERE id = $3 RETURNING id, email, full_name, avatar_url, is_admin',
    [full_name, avatar_url, req.user!.id]
  );
  res.json(result.rows[0]);
});

router.post('/change-password', requireAuth, authLimiter, async (req: Request, res: Response) => {
  const { current_password, new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
  const hash = await bcrypt.hash(new_password, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user!.id]);
  res.json({ success: true });
});

// POST /api/auth/forgot-password — send reset email
router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Always respond with success (don't leak whether email exists)
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });

  // Do the actual work async
  (async () => {
    try {
      const userRes = await query('SELECT id, email, full_name FROM users WHERE email = $1', [email.toLowerCase()]);
      if (!userRes.rows[0]) return;
      const user = userRes.rows[0];

      // Delete any existing tokens for this user
      await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

      // Create new token
      const token = crypto.randomBytes(32).toString('hex');
      await query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
        [user.id, token]
      );

      await sendPasswordResetEmail(user.email, user.full_name || 'there', token);
    } catch (err) {
      console.error('[Auth] forgot-password error:', err);
    }
  })();
});

// POST /api/auth/reset-password — consume token and set new password
router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ error: 'Valid token and password (min 8 chars) required' });
  }

  try {
    const tokenRes = await query(
      'SELECT t.id, t.user_id, t.expires_at, t.used_at FROM password_reset_tokens t WHERE t.token = $1',
      [token]
    );
    if (!tokenRes.rows[0]) return res.status(400).json({ error: 'Invalid or expired reset link' });

    const row = tokenRes.rows[0];
    if (row.used_at) return res.status(400).json({ error: 'This reset link has already been used' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

    const hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, row.user_id]);
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [row.id]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[Auth] reset-password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
