import { Router, Request, Response } from 'express';
import { schedulerService } from '../services/scheduler.service';

const router = Router();

router.get('/reminders', async (req: Request, res: Response) => {
  // Validate the request is coming from Vercel Cron
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET is not defined in environment variables');
    res.status(500).json({ success: false, message: 'Server misconfiguration' });
    return;
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  try {
    const result = await schedulerService.triggerManually();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Cron] Error executing daily reminders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
