// Scheduler service — daily cron jobs for watering reminders
import cron from 'node-cron';
import { prisma } from '../config/database';
import { notificationService } from './notification.service';

/**
 * Checks for trees that are overdue for watering and sends push
 * notifications to all their adopting volunteers.
 */
async function checkOverdueTrees(): Promise<void> {
  console.log('[Scheduler] Checking for overdue trees...');

  const trees = await prisma.tree.findMany({
    include: {
      wateringEvents: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
      adoptions: {
        include: {
          user: { select: { expoPushToken: true } },
        },
      },
    },
  });

  let notifiedCount = 0;

  for (const tree of trees) {
    const lastWatered = tree.wateringEvents[0]?.createdAt;
    const daysSince = lastWatered
      ? (Date.now() - lastWatered.getTime()) / 86_400_000
      : Infinity;

    // Send notifications if watering is overdue or due soon
    if (daysSince >= tree.wateringPeriodDays - 1) {
      const tokens = tree.adoptions
        .map((a) => a.user.expoPushToken)
        .filter((token): token is string => !!token);

      if (tokens.length > 0) {
        await notificationService.sendWateringReminder(tree.name, tree.id, tokens);
        notifiedCount += tokens.length;
      }
    }
  }

  console.log(`[Scheduler] Sent ${notifiedCount} watering reminders`);
}

export const schedulerService = {
  /**
   * Start the daily cron job.
   * Runs every day at 08:00 AM (Turkey time).
   */
  start() {
    // Run daily at 8 AM
    cron.schedule('0 8 * * *', async () => {
      try {
        await checkOverdueTrees();
      } catch (error) {
        console.error('[Scheduler] Cron job failed:', error);
      }
    }, {
      timezone: 'Europe/Istanbul',
    });

    console.log('📅 Cron scheduler started (daily at 08:00 Europe/Istanbul)');
  },

  /**
   * Manually trigger the overdue check — used by the debug API.
   */
  async triggerManually() {
    await checkOverdueTrees();
    return { message: 'Cron job manually triggered' };
  },
};
