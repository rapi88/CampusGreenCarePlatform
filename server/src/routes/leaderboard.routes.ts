import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/', auth, leaderboardController.getLeaderboard);

export default router;
