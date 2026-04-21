// Auth controller — handles HTTP layer for auth endpoints
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      const result = await authService.register(name, email, password);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.me(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async registerPushToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { expoPushToken } = req.body;
      const result = await authService.registerPushToken(req.user!.id, expoPushToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
