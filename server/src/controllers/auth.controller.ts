// Auth controller — handles HTTP layer for auth endpoints
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { config } from '../config/env';

function renderAuthResultPage(options: {
  title: string;
  message: string;
  status: 'success' | 'error';
}) {
  const isSuccess = options.status === 'success';
  const color = isSuccess ? '#2E7D32' : '#F44336';
  const bg = isSuccess ? '#E8F5E9' : '#FFEBEE';
  const icon = isSuccess ? '✓' : '!';

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${options.title}</title>
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #F5F7F5; color: #1C1C1E; }
          .card { width: min(420px, calc(100vw - 32px)); background: #fff; border-radius: 18px; padding: 32px 28px; text-align: center; box-shadow: 0 16px 36px rgba(0,0,0,.10); box-sizing: border-box; }
          .icon { width: 72px; height: 72px; margin: 0 auto 18px; border-radius: 22px; display: grid; place-items: center; background: ${bg}; color: ${color}; font-size: 42px; font-weight: 900; }
          h1 { margin: 0 0 10px; font-size: 28px; line-height: 1.15; }
          p { margin: 0; color: #6E6E73; font-size: 16px; line-height: 1.55; }
        </style>
      </head>
      <body>
        <main class="card">
          <div class="icon">${icon}</div>
          <h1>${options.title}</h1>
          <p>${options.message}</p>
        </main>
      </body>
    </html>
  `;
}

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

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      if (!token) {
        res.status(400).send(renderAuthResultPage({
          status: 'error',
          title: 'Bağlantı geçersiz',
          message: 'Doğrulama bağlantısı eksik veya hatalı görünüyor.',
        }));
        return;
      }
      await authService.verifyEmail(token);
      res.send(renderAuthResultPage({
        status: 'success',
        title: 'E-posta doğrulandı',
        message: 'Hesabınız başarıyla doğrulandı. Artık uygulamadan giriş yapabilirsiniz.',
      }));
    } catch (error) {
      res.status(400).send(renderAuthResultPage({
        status: 'error',
        title: 'Doğrulama başarısız',
        message: 'Bu bağlantı geçersiz, süresi dolmuş veya daha önce kullanılmış olabilir.',
      }));
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

  async resetPasswordPage(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      if (!token) {
        res.status(400).send('Geçersiz şifre sıfırlama bağlantısı.');
        return;
      }

      res.send(`
        <!doctype html>
        <html lang="tr">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Şifre Sıfırlama</title>
            <style>
              body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #F5F7F5; color: #1C1C1E; }
              form { width: min(420px, calc(100vw - 32px)); background: #fff; border-radius: 16px; padding: 28px; box-shadow: 0 12px 28px rgba(0,0,0,.08); }
              h1 { margin: 0 0 8px; font-size: 26px; }
              p { color: #6E6E73; line-height: 1.5; }
              label { display: block; font-weight: 700; margin: 18px 0 8px; }
              input { width: 100%; box-sizing: border-box; height: 48px; border: 1px solid #D1D1D6; border-radius: 10px; padding: 0 14px; font-size: 16px; }
              button { width: 100%; height: 50px; border: 0; border-radius: 10px; margin-top: 20px; background: #4CAF50; color: #fff; font-size: 16px; font-weight: 800; cursor: pointer; }
            </style>
          </head>
          <body>
            <form method="post" action="/api/auth/reset-password">
              <h1>Şifre Sıfırlama</h1>
              <p>Yeni şifrenizi belirleyin. Şifreniz en az 8 karakter, bir büyük harf ve bir rakam içermelidir.</p>
              <input type="hidden" name="token" value="${token.replace(/"/g, '&quot;')}" />
              <label for="password">Yeni Şifre</label>
              <input id="password" name="password" type="password" required minlength="8" />
              <button type="submit">Şifreyi Güncelle</button>
            </form>
          </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      if (req.headers.accept?.includes('text/html')) {
        res.send(`
          <!doctype html>
          <html lang="tr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Şifre Güncellendi</title>
          <style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#F5F7F5;color:#1C1C1E}.box{width:min(420px,calc(100vw - 32px));background:#fff;border-radius:16px;padding:28px;text-align:center;box-shadow:0 12px 28px rgba(0,0,0,.08)}h1{color:#2E7D32}</style></head>
          <body><div class="box"><h1>Şifre güncellendi</h1><p>Artık uygulamadan yeni şifrenizle giriş yapabilirsiniz.</p></div></body></html>
        `);
        return;
      }
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
};
