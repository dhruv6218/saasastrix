import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db';
import { signToken, requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

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

export default router;
