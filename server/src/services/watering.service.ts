// Watering service — GPS-validated watering events with points
import { prisma } from '../config/database';
import { config } from '../config/env';
import { haversineDistance } from '../utils/geo';
import { BadRequestError, NotFoundError } from '../utils/errors';

const WATERING_POINTS = 10;

export const wateringService = {
  async water(userId: string, treeId: string, userLat: number, userLng: number) {
    // Fetch tree
    const tree = await prisma.tree.findUnique({ where: { id: treeId } });
    if (!tree) throw new NotFoundError('Tree not found');

    // GPS proximity check (server-side validation)
    const distance = haversineDistance(userLat, userLng, tree.latitude, tree.longitude);
    const gpsVerified = distance <= config.wateringProximityThreshold;

    if (!gpsVerified) {
      throw new BadRequestError(
        `You must be near the tree to water it. Your distance: ${Math.round(distance)} meters (max: ${config.wateringProximityThreshold} m)`
      );
    }

    // Create watering event and award points in a transaction
    const [event] = await prisma.$transaction([
      prisma.wateringEvent.create({
        data: {
          userId,
          treeId,
          latitude: userLat,
          longitude: userLng,
          gpsVerified,
          pointsAwarded: WATERING_POINTS,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: WATERING_POINTS } },
      }),
    ]);

    return {
      message: 'Tree successfully watered',
      pointsAwarded: WATERING_POINTS,
      gpsVerified,
      distanceM: Math.round(distance),
      eventId: event.id,
    };
  },

  async reportIssue(userId: string, treeId: string, description: string) {
    const tree = await prisma.tree.findUnique({ where: { id: treeId } });
    if (!tree) throw new NotFoundError('Tree not found');

    const report = await prisma.issueReport.create({
      data: { userId, treeId, description },
    });

    return { message: 'Issue reported', reportId: report.id };
  },
};
