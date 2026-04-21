// Notes controller — tree notes CRUD
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';

export const notesController = {
  async getNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const treeId = req.params.treeId as string;

      const tree = await prisma.tree.findUnique({ where: { id: treeId } });
      if (!tree) throw new NotFoundError('Ağaç bulunamadı');

      const notes = await prisma.treeNote.findMany({
        where: { treeId },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(
        notes.map((n) => ({
          id: n.id,
          treeId: n.treeId,
          userId: n.user.id,
          userName: n.user.name,
          userAvatar: n.user.avatarUrl,
          text: n.text,
          createdAt: n.createdAt.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  },

  async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const treeId = req.params.treeId as string;
      const { text } = req.body;

      const tree = await prisma.tree.findUnique({ where: { id: treeId } });
      if (!tree) throw new NotFoundError('Ağaç bulunamadı');

      const note = await prisma.treeNote.create({
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
        id: note.id,
        treeId: note.treeId,
        userId: note.user.id,
        userName: note.user.name,
        userAvatar: note.user.avatarUrl,
        text: note.text,
        createdAt: note.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      const treeId = req.params.treeId as string;
      const noteId = req.params.noteId as string;

      const note = await prisma.treeNote.findFirst({
        where: { id: noteId, treeId },
      });

      if (!note) throw new NotFoundError('Not bulunamadı');

      // Only the author or admin can delete
      if (note.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new ForbiddenError('Bu notu silme yetkiniz yok');
      }

      await prisma.treeNote.delete({ where: { id: noteId } });
      res.json({ message: 'Not silindi' });
    } catch (error) {
      next(error);
    }
  },
};
