import { Request, Response, NextFunction } from 'express';
import { treeService } from '../services/tree.service';
import { reportService } from '../services/report.service';

export const adminController = {
  // ── Tree CRUD ──────────────────────────────────────────

  async createTree(req: Request, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body };
      const tree = await treeService.create(data);
      res.status(201).json(tree);
    } catch (error) {
      next(error);
    }
  },

  async updateTree(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = { ...req.body };

      const tree = await treeService.update(id, data);
      res.json(tree);
    } catch (error) {
      next(error);
    }
  },

  async deleteTree(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await treeService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // ── Suggestions ──────────────────────────────────────────

  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const trees = await treeService.getAll('PENDING');
      res.json(trees);
    } catch (error) {
      next(error);
    }
  },

  async approveSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const tree = await treeService.approve(id);
      res.json(tree);
    } catch (error) {
      next(error);
    }
  },

  async rejectSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const result = await treeService.deny(id, reason);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async uploadTreePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!req.file) {
        res.status(400).json({ message: 'No photo provided' });
        return;
      }
      
      const tree = await treeService.uploadPhoto(id, req.file);
      res.json(tree);
    } catch (error) {
      next(error);
    }
  },



  // ── Reports ────────────────────────────────────────────

  async getWateringReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query;
      const report = await reportService.getWateringReport(from as string, to as string);
      res.json(report);
    } catch (error) {
      next(error);
    }
  },

  // ── Users ──────────────────────────────────────────────

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await reportService.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  },

  async getUserScore(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const score = await reportService.getUserScore(userId);
      res.json(score);
    } catch (error) {
      next(error);
    }
  },

  // ── Dashboard Stats ────────────────────────────────────

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reportService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },


};
