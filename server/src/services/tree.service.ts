// Tree service — CRUD + dynamic status computation
import { prisma } from '../config/database';
import { Health } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

type TreeStatus = 'watered' | 'needs_water' | 'due_soon';
type HealthLabel = 'Sağlıklı' | 'Hasta' | 'Kritik';

const HEALTH_MAP: Record<Health, HealthLabel> = {
  HEALTHY: 'Sağlıklı',
  SICK: 'Hasta',
  CRITICAL: 'Kritik',
};

function computeStatus(lastWateredAt: Date | null, wateringPeriodDays: number): TreeStatus {
  if (!lastWateredAt) return 'needs_water';

  const daysSince = (Date.now() - lastWateredAt.getTime()) / 86_400_000;

  if (daysSince <= wateringPeriodDays - 1) return 'watered';
  if (daysSince <= wateringPeriodDays) return 'due_soon';
  return 'needs_water';
}

function buildPhotoUrl(photoPath: string | null): string | undefined {
  if (!photoPath) return undefined;
  return photoPath; // Frontend prepends the server base URL
}

export const treeService = {
  async getAll(statusFilter?: TreeStatus, isApproved: boolean = true) {
    const trees = await prisma.tree.findMany({
      where: { isApproved },
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

    const result = trees.map((tree) => {
      const lastWatered = tree.wateringEvents[0]?.createdAt ?? null;
      const status = computeStatus(lastWatered, tree.wateringPeriodDays);

      return {
        id: tree.id,
        name: tree.name,
        species: tree.species,
        latitude: tree.latitude,
        longitude: tree.longitude,
        status,
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

    // Apply status filter if provided
    if (statusFilter) {
      return result.filter((t) => t.status === statusFilter);
    }

    return result;
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
      throw new NotFoundError('Ağaç bulunamadı');
    }

    const lastEvent = tree.wateringEvents[0] ?? null;
    const status = computeStatus(lastEvent?.createdAt ?? null, tree.wateringPeriodDays);

    return {
      id: tree.id,
      name: tree.name,
      species: tree.species,
      latitude: tree.latitude,
      longitude: tree.longitude,
      status,
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
    const healthEnum = data.health === 'Hasta'
      ? Health.SICK
      : data.health === 'Kritik'
        ? Health.CRITICAL
        : Health.HEALTHY;

    const tree = await prisma.tree.create({
      data: {
        name: data.name,
        species: data.species,
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
        isApproved: true,
      },
    });

    return this.getById(tree.id);
  },

  async suggest(data: {
    name: string;
    species: string;
    latitude: number;
    longitude: number;
    location: string;
  }) {
    const tree = await prisma.tree.create({
      data: {
        name: data.name,
        species: data.species,
        latitude: data.latitude,
        longitude: data.longitude,
        location: data.location,
        isApproved: false,
      },
    });

    return tree;
  },

  async approve(id: string) {
    await prisma.tree.update({
      where: { id },
      data: { isApproved: true },
    });
    return this.getById(id);
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
    // Verify tree exists
    const existing = await prisma.tree.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Ağaç bulunamadı');

    const updateData: any = { ...data };

    // Convert health string to enum if provided
    if (data.health) {
      updateData.health = data.health === 'Hasta'
        ? Health.SICK
        : data.health === 'Kritik'
          ? Health.CRITICAL
          : Health.HEALTHY;
    }

    // Convert planting date
    if (data.plantingDate) {
      updateData.plantingDate = new Date(data.plantingDate);
    }

    await prisma.tree.update({ where: { id }, data: updateData });
    return this.getById(id);
  },

  async delete(id: string) {
    const existing = await prisma.tree.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Ağaç bulunamadı');

    await prisma.tree.delete({ where: { id } });
    return { message: 'Ağaç silindi' };
  },
};
