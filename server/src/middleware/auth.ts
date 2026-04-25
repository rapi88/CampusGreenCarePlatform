// JWT authentication middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { UnauthorizedError } from '../utils/errors';

export interface AuthPayload {
  userId: string;
  role: string;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        points: number;
      };
    }
  }
}

export async function auth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token gereklidir');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, points: true },
    });

    if (!user) {
      throw new UnauthorizedError('Kullanıcı bulunamadı');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Geçersiz token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token süresi dolmuş'));
    } else {
      next(error);
    }
  }
}
