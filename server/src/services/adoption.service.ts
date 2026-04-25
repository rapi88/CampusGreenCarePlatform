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
    if (!tree) throw new NotFoundError('Ağaç bulunamadı');

    // Check tree volunteer capacity
    if (tree._count.adoptions >= tree.maxVolunteers) {
      throw new BadRequestError('Bu ağacın gönüllü kontenjanı dolu');
    }

    // Check user adoption limit
    const userAdoptionCount = await prisma.adoption.count({ where: { userId } });
    if (userAdoptionCount >= MAX_TREES_PER_USER) {
      throw new BadRequestError(`Bir kullanıcı en fazla ${MAX_TREES_PER_USER} ağaç sahiplenebilir`);
    }

    // Check if already adopted
    const existing = await prisma.adoption.findUnique({
      where: { userId_treeId: { userId, treeId } },
    });
    if (existing) {
      throw new ConflictError('Bu ağacı zaten sahiplendiniz');
    }

    await prisma.adoption.create({
      data: { userId, treeId },
    });

    return { message: 'Ağaç başarıyla sahiplenildi' };
  },

  async leave(userId: string, treeId: string) {
    const adoption = await prisma.adoption.findUnique({
      where: { userId_treeId: { userId, treeId } },
    });

    if (!adoption) {
      throw new NotFoundError('Bu ağacı sahiplenmemişsiniz');
    }

    await prisma.adoption.delete({
      where: { userId_treeId: { userId, treeId } },
    });

    return { message: 'Sahiplenme iptal edildi' };
  },
};
