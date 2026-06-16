// Adoption service — adopt/leave tree logic with capacity checks
import { prisma } from '../config/database';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';

const MAX_TREES_PER_USER = 10;

export const adoptionService = {
  async adopt(userId: string, treeId: string) {
    // Check tree exists
    const tree = await prisma.tree.findUnique({
      where: { id: treeId },
      include: { _count: { select: { adoptions: true } } },
    });
    if (!tree) throw new NotFoundError('Tree not found');

    if (tree.status !== 'ACTIVE') {
      throw new BadRequestError('Only active trees can be adopted');
    }

    // Check tree volunteer capacity
    if (tree._count.adoptions >= tree.maxVolunteers) {
      throw new BadRequestError('Maximum volunteer capacity reached for this tree');
    }

    // Check user adoption limit
    const userAdoptionCount = await prisma.adoption.count({
      where: {
        userId,
        tree: { is: { status: 'ACTIVE' } },
      },
    });
    if (userAdoptionCount >= MAX_TREES_PER_USER) {
      throw new BadRequestError(`A user can adopt a maximum of ${MAX_TREES_PER_USER} trees`);
    }

    // Check if already adopted
    const existing = await prisma.adoption.findUnique({
      where: { userId_treeId: { userId, treeId } },
    });
    if (existing) {
      throw new ConflictError('You have already adopted this tree');
    }

    await prisma.adoption.create({
      data: { userId, treeId },
    });

    return { message: 'Tree successfully adopted' };
  },

  async leave(userId: string, treeId: string) {
    const adoption = await prisma.adoption.findUnique({
      where: { userId_treeId: { userId, treeId } },
    });

    if (!adoption) {
      throw new NotFoundError('You have not adopted this tree');
    }

    await prisma.adoption.delete({
      where: { userId_treeId: { userId, treeId } },
    });

    return { message: 'Adoption cancelled' };
  },
};
