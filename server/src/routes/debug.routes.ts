// Debug routes — admin-only testing and debugging
import { Router } from 'express';
import { debugController } from '../controllers/debug.controller';
import { auth } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

// All debug routes require admin authentication
router.use(auth, adminOnly);

router.post('/push-notification', debugController.sendPushNotification);
router.post('/trigger-cron', debugController.triggerCron);
router.post('/seed-data', debugController.seedData);

export default router;
