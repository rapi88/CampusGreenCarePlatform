// Debug routes — protected by auth. Admin tab visibility is handled in the app.
import { Router } from 'express';
import { debugController } from '../controllers/debug.controller';
import { auth } from '../middleware/auth';

const router = Router();

router.use(auth);

router.post('/push-notification', debugController.sendPushNotification);
router.post('/trigger-cron', debugController.triggerCron);
router.post('/seed-data', debugController.seedData);

// Notification test center endpoints
router.get('/notify/status', debugController.getTokenStatus);
router.post('/notify/self', debugController.sendSelfTest);
router.post('/notify/watering-reminder', debugController.sendWateringReminderForTree);
router.post('/notify/broadcast', debugController.broadcastTest);
router.post('/notify/receipts', debugController.checkReceipts);

export default router;
