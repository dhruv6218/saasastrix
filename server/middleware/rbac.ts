import { Request, Response, NextFunction } from 'express';

const ROLE_LEVELS: Record<string, number> = {
  viewer: 1,
  maker: 2,
  admin: 3,
  owner: 4,
};

export const requireRole = (minRole: 'viewer' | 'maker' | 'admin' | 'owner') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userLevel = ROLE_LEVELS[req.workspaceRole || 'viewer'] || 0;
    const required = ROLE_LEVELS[minRole];

    if (userLevel < required) {
      return res.status(403).json({
        error: `This action requires ${minRole} role or higher`,
      });
    }
    next();
  };
};
