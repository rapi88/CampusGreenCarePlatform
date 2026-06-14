// Watering service — GPS-validated watering events with points
import { prisma } from '../config/database';
import { config } from '../config/env';
import { haversineDistance } from '../utils/geo';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

const WATERING_POINTS = 10;

export const wateringService = {
  async water(userId: string, treeId: string, userLat: number, userLng: number) {
    // Fetch tree
    const tree = await prisma.tree.findUnique({ where: { id: treeId } });
    if (!tree) throw new NotFoundError('Tree not found');

    const adoption = await prisma.adoption.findUnique({
      where: { userId_treeId: { userId, treeId } },
    });

    if (!adoption) {
      throw new ForbiddenError('Bu ağacı sulayamazsınız. Bu ağacın gönüllüsü değilsiniz.');
    }

    // GPS proximity check (server-side validation)
    const distance = haversineDistance(userLat, userLng, tree.latitude, tree.longitude);
    const gpsVerified = distance <= config.wateringProximityThreshold;

    if (!gpsVerified) {
      throw new BadRequestError(
        `Ağacı sulamak için ağaca daha yakın olmalısınız. Uzaklığınız: ${Math.round(distance)} metre (en fazla ${config.wateringProximityThreshold} m)`
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

};
