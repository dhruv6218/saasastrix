import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      workspaceRole?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'astrix-dev-secret-change-in-prod';

export const signToken = (user: AuthUser) =>
  jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  await requireAuth(req, res, async () => {
    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

export const attachWorkspaceRole = async (req: Request, res: Response, next: NextFunction) => {
  const wsId = req.params.wsId;
  if (!wsId || !req.user) return next();

  const result = await query(
    'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
    [wsId, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(403).json({ error: 'Not a member of this workspace' });
  }

  req.workspaceRole = result.rows[0].role;
  next();
};
