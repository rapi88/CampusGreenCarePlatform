import { Router } from 'express';
import { AwardController } from '../controllers/award.controller';
import { auth } from '../middleware/auth';

const router = Router();

// Public route to get weekly award
router.get('/weekly', AwardController.getWeeklyAward);

// Award update is available to authenticated users who can see the editor in the app.
router.put('/weekly', auth, AwardController.updateWeeklyAward);

export default router;
