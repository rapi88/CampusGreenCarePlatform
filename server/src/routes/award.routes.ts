import { Router } from 'express';
import { AwardController } from '../controllers/award.controller';
import { auth } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

// Public route to get weekly award
router.get('/weekly', AwardController.getWeeklyAward);

// Admin route to update weekly award
router.put('/weekly', auth, adminOnly, AwardController.updateWeeklyAward);

export default router;
