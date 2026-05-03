import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from '../services/leaderboard.service';

export const leaderboardController = {
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as 'alltime' | 'monthly') || 'alltime';
      // req.user might be undefined if not authenticated, but we usually protect this route
      const userId = req.user?.id;
      const data = await leaderboardService.getLeaderboard(period, userId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
};
