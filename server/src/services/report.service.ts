// Report service — admin dashboard stats and watering history
import { prisma } from '../config/database';

export const reportService = {
  /**
   * Dashboard stats for admin panel.
   */
  async getDashboardStats() {
    const [totalTrees, activeVolunteers, wateringsToday, openIssues] = await Promise.all([
      prisma.tree.count(),
      prisma.user.count({ where: { role: 'USER', adoptions: { some: {} } } }),
      prisma.wateringEvent.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.issueReport.count({ where: { resolved: false } }),
    ]);

    return {
      totalTrees,
      activeVolunteers,
      wateringsToday,
      openIssues,
    };
  },

  /**
   * Watering history report with date range filter.
   */
  async getWateringReport(from?: string, to?: string) {
    const where: any = {};

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const events = await prisma.wateringEvent.findMany({
      where,
      include: {
        tree: { select: { name: true, location: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit for performance
    });

    return events.map((e) => ({
      id: e.id,
      tree: e.tree.name,
      treeLocation: e.tree.location,
      user: e.user.name,
      userEmail: e.user.email,
      date: e.createdAt.toISOString(),
      gpsVerified: e.gpsVerified,
    }));
  },

  /**
   * List all users for admin management.
   */
  async getAllUsers() {
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { adoptions: true, wateringEvents: true } },
      },
      orderBy: { points: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      points: u.points,
      adoptedTrees: u._count.adoptions,
      totalWaterings: u._count.wateringEvents,
      createdAt: u.createdAt.toISOString(),
    }));
  },

  /**
   * Get detailed score info for a specific user.
   */
  async getUserScore(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { adoptions: true, wateringEvents: true } },
        wateringEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            tree: { select: { name: true } },
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      points: user.points,
      adoptedTrees: user._count.adoptions,
      totalWaterings: user._count.wateringEvents,
      recentWaterings: user.wateringEvents.map((e) => ({
        treeName: e.tree.name,
        date: e.createdAt.toISOString(),
        pointsAwarded: e.pointsAwarded,
      })),
    };
  }
};
