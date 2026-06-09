import { prisma } from '../config/database';
import { Health, TreeStatus } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

export type ComputedTreeStatus = 'watered' | 'needs_water' | 'due_soon';
type HealthLabel = 'Healthy' | 'Sick' | 'Critical';

const HEALTH_MAP: Record<Health, HealthLabel> = {
  HEALTHY: 'Healthy',
  SICK: 'Sick',
  CRITICAL: 'Critical',
};

function computeWateringStatus(lastWateredAt: Date | null, wateringPeriodDays: number): ComputedTreeStatus {
  if (!lastWateredAt) return 'needs_water';

  const daysSince = (Date.now() - lastWateredAt.getTime()) / 86_400_000;

  if (daysSince <= wateringPeriodDays - 1) return 'watered';
  if (daysSince <= wateringPeriodDays) return 'due_soon';
  return 'needs_water';
}

function buildPhotoUrl(photoPath: string | null): string | undefined {
  if (!photoPath) return undefined;
  return photoPath; // Frontend will just use this URL directly since it's now a full Supabase URL
}

export const treeService = {
  async getAll(statusFilter: TreeStatus = 'ACTIVE') {
    const trees = await prisma.tree.findMany({
      where: { status: statusFilter },
      include: {
        wateringEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
        _count: { select: { adoptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return trees.map((tree) => {
      const lastWatered = tree.wateringEvents[0]?.createdAt ?? null;
      const computedStatus = computeWateringStatus(lastWatered, tree.wateringPeriodDays);

      return {
        id: tree.id,
        name: tree.name,
        species: tree.species,
        latitude: tree.latitude,
        longitude: tree.longitude,
        status: computedStatus,
        approvalStatus: tree.status,
        photoUrl: buildPhotoUrl(tree.photoPath),
        estimatedAge: tree.estimatedAge,
        height: tree.height,
        plantingDate: tree.plantingDate?.toISOString() ?? null,
        wateringPeriodDays: tree.wateringPeriodDays,
        lastWateredAt: lastWatered?.toISOString() ?? null,
        location: tree.location,
        isNaturalMonument: tree.isNaturalMonument,
        health: HEALTH_MAP[tree.health],
        volunteerCount: tree._count.adoptions,
        maxVolunteers: tree.maxVolunteers,
      };
    });
  },

  async getMyTrees(userId: string) {
    // Adopted trees
    const adoptions = await prisma.adoption.findMany({
      where: { userId },
      include: {
        tree: {
          include: {
            wateringEvents: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
            _count: { select: { adoptions: true } },
          }
        }
      }
    });

    const adoptedTrees = adoptions.map(a => {
      const tree = a.tree;
      const lastWatered = tree.wateringEvents[0]?.createdAt ?? null;
      return {
        id: tree.id,
        name: tree.name,
        species: tree.species,
        latitude: tree.latitude,
        longitude: tree.longitude,
        status: computeWateringStatus(lastWatered, tree.wateringPeriodDays),
        approvalStatus: tree.status,
        photoUrl: buildPhotoUrl(tree.photoPath),
        location: tree.location,
        isAdopted: true,
        isSuggested: false,
      };
    });

    // Suggested trees that are not dismissed
    const suggestions = await prisma.treeSuggestion.findMany({
      where: { userId, dismissed: false },
      include: {
        tree: {
          include: {
            wateringEvents: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
            _count: { select: { adoptions: true } },
          }
        }
      }
    });

    const suggestedTrees = suggestions.map(s => {
      const tree = s.tree;
      const lastWatered = tree.wateringEvents[0]?.createdAt ?? null;
      return {
        id: tree.id,
        name: tree.name,
        species: tree.species,
        latitude: tree.latitude,
        longitude: tree.longitude,
        status: computeWateringStatus(lastWatered, tree.wateringPeriodDays),
        approvalStatus: tree.status,
        photoUrl: buildPhotoUrl(tree.photoPath),
        location: tree.location,
        isAdopted: false,
        isSuggested: true,
        suggestionId: s.id,
      };
    });

    // We don't want to list a tree twice if they adopted their own suggestion and it's active.
    // Actually, if it's active, it might still show up in suggestions unless we filter.
    // Let's filter out active trees from suggestions since they are either already in adopted or just public now.
    const pendingOrDeniedSuggestions = suggestedTrees.filter(t => t.approvalStatus === 'PENDING' || t.approvalStatus === 'DENIED');

    return {
      adopted: adoptedTrees,
      suggested: pendingOrDeniedSuggestions,
    };
  },

  async getById(id: string) {
    const tree = await prisma.tree.findUnique({
      where: { id },
      include: {
        wateringEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { adoptions: true } },
        adoptions: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!tree) {
      throw new NotFoundError('Tree not found');
    }

    const lastEvent = tree.wateringEvents[0] ?? null;
    const computedStatus = computeWateringStatus(lastEvent?.createdAt ?? null, tree.wateringPeriodDays);

    return {
      id: tree.id,
      name: tree.name,
      species: tree.species,
      latitude: tree.latitude,
      longitude: tree.longitude,
      status: computedStatus,
      approvalStatus: tree.status,
      photoUrl: buildPhotoUrl(tree.photoPath),
      estimatedAge: tree.estimatedAge,
      height: tree.height,
      plantingDate: tree.plantingDate?.toISOString() ?? null,
      wateringPeriodDays: tree.wateringPeriodDays,
      lastWateredAt: lastEvent?.createdAt.toISOString() ?? null,
      location: tree.location,
      isNaturalMonument: tree.isNaturalMonument,
      health: HEALTH_MAP[tree.health],
      volunteerCount: tree._count.adoptions,
      maxVolunteers: tree.maxVolunteers,
      volunteers: tree.adoptions.map((a) => ({
        id: a.user.id,
        name: a.user.name,
        avatarUrl: a.user.avatarUrl,
      })),
      lastCaretaker: lastEvent
        ? {
            id: lastEvent.user.id,
            name: lastEvent.user.name,
            avatarUrl: lastEvent.user.avatarUrl,
          }
        : null,
    };
  },

  async create(data: {
    name: string;
    species: string;
    latitude: number;
    longitude: number;
    location: string;
    photoPath?: string;
    estimatedAge?: number;
    height?: number;
    plantingDate?: string;
    wateringPeriodDays?: number;
    isNaturalMonument?: boolean;
    health?: string;
    maxVolunteers?: number;
  }) {
    const healthEnum = data.health === 'Sick' || data.health === 'Hasta'
      ? Health.SICK
      : data.health === 'Critical' || data.health === 'Kritik'
        ? Health.CRITICAL
        : Health.HEALTHY;

    const tree = await prisma.tree.create({
      data: {
        name: data.name,
        species: data.species || 'Bilinmiyor',
        latitude: data.latitude,
        longitude: data.longitude,
        location: data.location,
        photoPath: data.photoPath || null,
        estimatedAge: data.estimatedAge || 0,
        height: data.height || 0,
        plantingDate: data.plantingDate ? new Date(data.plantingDate) : null,
        wateringPeriodDays: data.wateringPeriodDays || 3,
        isNaturalMonument: data.isNaturalMonument || false,
        health: healthEnum,
        maxVolunteers: data.maxVolunteers || 4,
        status: 'ACTIVE',
      },
    });

    return this.getById(tree.id);
  },

  async suggest(data: {
    name: string;
    species?: string;
    latitude: number;
    longitude: number;
    location: string;
  }, userId: string) {
    const tree = await prisma.tree.create({
      data: {
        name: data.name,
        species: data.species || 'Bilinmiyor',
        latitude: data.latitude,
        longitude: data.longitude,
        location: data.location,
        status: 'PENDING',
        suggestion: {
          create: {
            userId: userId
          }
        }
      },
      include: {
        suggestion: true
      }
    });

    return tree;
  },

  async approve(id: string) {
    await prisma.tree.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    return this.getById(id);
  },

  async deny(id: string) {
    await prisma.tree.update({
      where: { id },
      data: { status: 'DENIED' },
    });
    return { message: 'Tree suggestion denied' };
  },

  async dismissSuggestion(treeId: string, userId: string) {
    const suggestion = await prisma.treeSuggestion.findUnique({
      where: { treeId }
    });
    
    if (!suggestion || suggestion.userId !== userId) {
      throw new NotFoundError('Suggestion not found or unauthorized');
    }

    await prisma.treeSuggestion.update({
      where: { treeId },
      data: { dismissed: true }
    });

    return { message: 'Suggestion dismissed' };
  },

  async update(id: string, data: Partial<{
    name: string;
    species: string;
    latitude: number;
    longitude: number;
    location: string;
    photoPath: string;
    estimatedAge: number;
    height: number;
    plantingDate: string;
    wateringPeriodDays: number;
    isNaturalMonument: boolean;
    health: string;
    maxVolunteers: number;
  }>) {
    const existing = await prisma.tree.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Tree not found');

    const updateData: any = { ...data };

    if (data.health) {
      updateData.health = data.health === 'Sick' || data.health === 'Hasta'
        ? Health.SICK
        : data.health === 'Critical' || data.health === 'Kritik'
          ? Health.CRITICAL
          : Health.HEALTHY;
    }

    if (data.plantingDate) {
      updateData.plantingDate = new Date(data.plantingDate);
    }

    await prisma.tree.update({ where: { id }, data: updateData });
    return this.getById(id);
  },

  async delete(id: string) {
    const existing = await prisma.tree.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Tree not found');

    await prisma.tree.update({ 
      where: { id },
      data: { status: 'REMOVED' }
    });
    return { message: 'Tree removed' };
  },
};
