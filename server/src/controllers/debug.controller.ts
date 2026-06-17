// Debug controller — admin-only testing and debugging endpoints
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { notificationService } from '../services/notification.service';
import { schedulerService } from '../services/scheduler.service';
import { NotFoundError } from '../utils/errors';
import { config } from '../config/env';

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

      if (!user) throw new NotFoundError('User not found');
      if (!user?.expoPushToken) {
        res.status(400).json({ message: 'User does not have a registered push token' });
        return;
      }

      const ticket = await notificationService.sendPush(
        user.expoPushToken,
        '🧪 Test Bildirimi',
        message || `Bu bir test bildirimidir — ${user.name}`
      );

      res.json({ message: 'Notification sent', ticket });
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
   * Send a test notification to the requesting admin's own device.
   */
  async sendSelfTest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!config.notificationDebug) {
        res.status(403).json({ message: 'Notification debug mode is disabled' });
        return;
      }

      const admin = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { expoPushToken: true, name: true },
      });

      if (!admin?.expoPushToken) {
        res.status(400).json({ message: 'Your device does not have a registered push token. Open the app and allow notifications.' });
        return;
      }

      const ticket = await notificationService.sendPush(
        admin.expoPushToken,
        '🧪 Notification Test',
        `Hello ${admin.name}! Push notifications are working correctly.`,
        { type: 'test' }
      );

      res.json({ message: 'Test notification sent to your device', ticket });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Send a watering reminder for a specific tree.
   * testMode=true  → sends only to the requesting admin (not the real adopters)
   * testMode=false → sends to all actual adopters of the tree
   */
  async sendWateringReminderForTree(req: Request, res: Response, next: NextFunction) {
    try {
      if (!config.notificationDebug) {
        res.status(403).json({ message: 'Notification debug mode is disabled' });
        return;
      }

      const { treeId, testMode = true } = req.body;
      if (!treeId) {
        res.status(400).json({ message: 'treeId is required' });
        return;
      }

      const tree = await prisma.tree.findUnique({
        where: { id: treeId },
        include: {
          adoptions: {
            include: { user: { select: { expoPushToken: true, name: true } } },
          },
        },
      });

      if (!tree) throw new NotFoundError('Tree not found');

      if (testMode) {
        // Send only to the admin doing the test
        const admin = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { expoPushToken: true },
        });
        if (!admin?.expoPushToken) {
          res.status(400).json({ message: 'Your device does not have a registered push token.' });
          return;
        }
        const ticket = await notificationService.sendPush(
          admin.expoPushToken,
          '💧 Sulama Zamanı!',
          `[TEST] ${tree.name} ağacının sulanma zamanı geldi. Kampüse gel ve ağacını sula! 🌳`,
          { treeId, type: 'watering_reminder' }
        );
        res.json({ message: `Watering reminder sent to your device (test mode)`, treeName: tree.name, ticket });
      } else {
        // Send to all real adopters
        const tokens = tree.adoptions
          .map((a) => a.user.expoPushToken)
          .filter((t): t is string => !!t);

        if (tokens.length === 0) {
          res.status(400).json({ message: 'No adopters with registered push tokens for this tree.' });
          return;
        }

        const batchResponse = await notificationService.sendWateringReminder(tree.name, tree.id, tokens);
        res.json({ message: `Watering reminder sent to ${batchResponse.successCount} adopter(s)`, treeName: tree.name, adoptersNotified: batchResponse.successCount });
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Broadcast a test notification to all users that have a push token.
   */
  async broadcastTest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!config.notificationDebug) {
        res.status(403).json({ message: 'Notification debug mode is disabled' });
        return;
      }

      const { message = 'Bu bir yayın testidir / This is a broadcast test.' } = req.body;

      const users = await prisma.user.findMany({
        where: { expoPushToken: { not: null } },
        select: { expoPushToken: true, name: true },
      });

      if (users.length === 0) {
        res.status(400).json({ message: 'No users with registered push tokens found.' });
        return;
      }

      const messages = users.map((u) => ({
        token: u.expoPushToken!,
        title: '📢 Campus Green',
        body: message,
        data: { type: 'broadcast_test' },
      }));

      const batchResponse = await notificationService.sendBatch(messages);

      const okCount = batchResponse.successCount;
      const errorCount = batchResponse.failureCount;
      
      const errors = batchResponse.responses
        .filter(r => !r.success)
        .map(r => ({ message: r.error?.message, details: r.error?.code }));

      res.json({
        message: `Broadcast: ${okCount} accepted, ${errorCount} rejected by FCM`,
        usersFound: users.length,
        validTokens: messages.length,
        accepted: okCount,
        rejected: errorCount,
        errors,
        hint: errorCount === 0
          ? 'Tüm bildirimler Firebase tarafindan kabul edildi.'
          : 'Bazi bildirimler FCM tarafindan reddedildi (muhtemelen gecersiz token).',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Return the push token registration status for all users.
   */
  async getTokenStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!config.notificationDebug) {
        res.status(403).json({ message: 'Notification debug mode is disabled' });
        return;
      }

      const total = await prisma.user.count();
      const registered = await prisma.user.count({ where: { expoPushToken: { not: null } } });
      const adminUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { expoPushToken: true },
      });

      res.json({
        total,
        registered,
        unregistered: total - registered,
        adminTokenRegistered: !!adminUser?.expoPushToken,
      });
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
