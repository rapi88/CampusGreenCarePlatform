// Tree controller — handles public tree endpoints
import { Request, Response, NextFunction } from 'express';
import { treeService } from '../services/tree.service';
import { adoptionService } from '../services/adoption.service';
import { wateringService } from '../services/watering.service';
import { prisma } from '../config/database';

export const treeController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const statusFilter = req.query.status as any || 'ACTIVE';
      const trees = await treeService.getAll(statusFilter);
      res.json(trees);
    } catch (error) {
      next(error);
    }
  },

  async getMyTrees(req: Request, res: Response, next: NextFunction) {
    try {
      const trees = await treeService.getMyTrees(req.user!.id);
      res.json(trees);
    } catch (error) {
      next(error);
    }
  },

  async suggest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const tree = await treeService.suggest(data, req.user!.id);
      res.status(201).json(tree);
    } catch (error) {
      next(error);
    }
  },

  async dismissSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await treeService.dismissSuggestion(id, req.user!.id);
      res.json(result);
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
