// Auth controller — handles HTTP layer for auth endpoints
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { config } from '../config/env';

// renderAuthResultPage removed as we no longer render HTML from the API

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

  async verifyCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      const result = await authService.verifyCode(email, code);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async resendCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerificationCode(email);
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

  async verifyResetCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      const result = await authService.verifyResetCode(email, code);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
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

  async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No image provided' });
        return;
      }

      const { StorageService } = require('../services/storage.service');
      const bucket = config.supabase.buckets.avatars;
      const storagePath = StorageService.generateObjectPath('avatars', req.user!.id, req.file.originalname);
      const publicUrl = await StorageService.uploadFile(
        bucket,
        storagePath,
        req.file.buffer,
        req.file.mimetype
      );

      const { prisma } = require('../config/database');
      const existingUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { avatarUrl: true },
      });

      await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatarUrl: publicUrl },
      });

      const previousPath = existingUser?.avatarUrl?.startsWith('http')
        ? StorageService.pathFromPublicUrl(bucket, existingUser.avatarUrl)
        : null;

      if (previousPath) {
        StorageService.deleteFile(bucket, previousPath).catch((error: Error) => {
          console.warn(`Failed to delete previous avatar from Supabase: ${error.message}`);
        });
      }

      res.json({ message: 'Avatar updated successfully', avatarUrl: publicUrl });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const updatedUser = await authService.updateProfile(req.user!.id, { name });
      res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
      next(error);
    }
  },
};
