// Admin-only role guard — must be used after auth middleware
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

export function adminOnly(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    next(new ForbiddenError('Bu işlem için admin yetkisi gereklidir'));
    return;
  }
  next();
}
