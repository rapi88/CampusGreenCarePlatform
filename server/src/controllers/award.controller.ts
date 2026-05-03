import { Request, Response } from 'express';
import { AwardService } from '../services/award.service';

export class AwardController {
  static async getWeeklyAward(req: Request, res: Response) {
    try {
      const award = await AwardService.getWeeklyAward();
      res.json(award);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch weekly award' });
    }
  }

  static async updateWeeklyAward(req: Request, res: Response) {
    try {
      const { photoUrl, text, userId } = req.body;
      const award = await AwardService.updateWeeklyAward({ photoUrl, text, userId });
      res.json({ message: 'Weekly award updated successfully', award });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to update weekly award' });
    }
  }
}
