// Chat controller — tree volunteer group chat
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export const chatController = {
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const treeId = req.params.treeId as string;

      // Verify tree exists
      const tree = await prisma.tree.findUnique({ where: { id: treeId } });
      if (!tree) throw new NotFoundError('Tree not found');

      const messages = await prisma.chatMessage.findMany({
        where: { treeId },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
      });

      res.json(
        messages.map((m) => ({
          id: m.id,
          treeId: m.treeId,
          userId: m.user.id,
          userName: m.user.name,
          userAvatar: m.user.avatarUrl,
          text: m.text,
          createdAt: m.createdAt.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  },

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const treeId = req.params.treeId as string;
      const { text } = req.body;

      // Verify tree exists
      const tree = await prisma.tree.findUnique({ where: { id: treeId } });
      if (!tree) throw new NotFoundError('Tree not found');

      const message = await prisma.chatMessage.create({
        data: {
          treeId,
          userId: req.user!.id,
          text,
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      res.status(201).json({
        id: message.id,
        treeId: message.treeId,
        userId: message.user.id,
        userName: message.user.name,
        userAvatar: message.user.avatarUrl,
        text: message.text,
        createdAt: message.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};
