// Tree controller — handles public tree endpoints
import { Request, Response, NextFunction } from 'express';
import { treeService } from '../services/tree.service';
import { adoptionService } from '../services/adoption.service';
import { wateringService } from '../services/watering.service';

export const treeController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const trees = await treeService.getAll(status as any);
      res.json(trees);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const tree = await treeService.getById(id);
      res.json(tree);
    } catch (error) {
      next(error);
    }
  },

  async adopt(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await adoptionService.adopt(req.user!.id, id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async leaveAdoption(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await adoptionService.leave(req.user!.id, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async water(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { latitude, longitude } = req.body;
      const result = await wateringService.water(req.user!.id, id, latitude, longitude);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async reportIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { description } = req.body;
      const result = await wateringService.reportIssue(req.user!.id, id, description);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
};
