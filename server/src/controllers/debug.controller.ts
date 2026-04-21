// Debug controller — admin-only testing and debugging endpoints
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { notificationService } from '../services/notification.service';
import { schedulerService } from '../services/scheduler.service';
import { NotFoundError } from '../utils/errors';

export const debugController = {
  /**
   * Send a test push notification to a specific user.
   */
  async sendPushNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, message } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { expoPushToken: true, name: true },
      });

      if (!user) throw new NotFoundError('Kullanıcı bulunamadı');
      if (!user.expoPushToken) {
        res.status(400).json({ message: 'Kullanıcının push token\'ı kayıtlı değil' });
        return;
      }

      const ticket = await notificationService.sendPush(
        user.expoPushToken,
        '🧪 Test Bildirimi',
        message || `Bu bir test bildirimidir — ${user.name}`
      );

      res.json({ message: 'Bildirim gönderildi', ticket });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Manually trigger the cron job.
   */
  async triggerCron(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await schedulerService.triggerManually();
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Seed sample data for testing.
   */
  async seedData(req: Request, res: Response, next: NextFunction) {
    try {
      // Create a batch of dummy trees around GTU campus
      const trees = await Promise.all([
        prisma.tree.create({
          data: {
            name: `Test Ağacı ${Date.now()}`,
            species: 'Test Species',
            latitude: 40.804 + Math.random() * 0.005,
            longitude: 29.361 + Math.random() * 0.005,
            location: 'Test Konum',
            wateringPeriodDays: 3,
          },
        }),
      ]);

      res.json({ message: `${trees.length} test ağaç oluşturuldu`, trees });
    } catch (error) {
      next(error);
    }
  },
};
