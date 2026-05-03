import { prisma } from '../config/database';

export const leaderboardService = {
  async getLeaderboard(period: 'alltime' | 'monthly', requestingUserId?: string) {
    let whereClause: any = { role: 'USER' };
    
    // For monthly, we only consider points earned this month
    // Note: Since points are cumulative on the user model, a true monthly leaderboard 
    // requires summing points from WateringEvents within the month.
    let dateFilter: Date | undefined;
    if (period === 'monthly') {
      const now = new Date();
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
    }

    let leaderboard = [];

    if (period === 'alltime') {
      // All-time is simple: use the pre-calculated points on the User model
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          points: true,
          _count: { select: { wateringEvents: true } },
        },
        orderBy: { points: 'desc' },
      });

      leaderboard = users.map((u, index) => ({
        rank: index + 1,
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        wateringCount: u._count.wateringEvents,
        points: u.points,
      }));
    } else {
      // Monthly: aggregate from WateringEvents
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          wateringEvents: {
            where: {
              createdAt: { gte: dateFilter }
            },
            select: { pointsAwarded: true }
          }
        }
      });

      // Calculate monthly points and count for each user
      let computedUsers = users.map(u => {
        const monthlyPoints = u.wateringEvents.reduce((sum, e) => sum + e.pointsAwarded, 0);
        const monthlyCount = u.wateringEvents.length;
        return {
          userId: u.id,
          name: u.name,
          avatarUrl: u.avatarUrl,
          wateringCount: monthlyCount,
          points: monthlyPoints
        };
      });

      // Filter out users with 0 points this month, sort descending
      computedUsers = computedUsers
        .filter(u => u.points > 0)
        .sort((a, b) => b.points - a.points);

      leaderboard = computedUsers.map((u, index) => ({
        rank: index + 1,
        ...u
      }));
    }

    // Include the requesting user's rank even if they are not in the top N
    let myRank = null;
    if (requestingUserId) {
      myRank = leaderboard.find(u => u.userId === requestingUserId) || null;
    }

    // Return top 50
    return {
      leaderboard: leaderboard.slice(0, 50),
      myRank
    };
  }
};
