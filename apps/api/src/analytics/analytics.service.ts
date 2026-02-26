import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(companyId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalProducts, totalSessions, monthlySessions, totalEvents] = await Promise.all([
      this.prisma.product.count({ where: { companyId } }),
      this.prisma.session.count({ where: { companyId } }),
      this.prisma.session.count({ where: { companyId, startedAt: { gte: monthStart } } }),
      this.prisma.event.count({ where: { companyId } }),
    ]);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });

    return {
      totalProducts,
      totalSessions,
      monthlySessions,
      monthlyLimit: company?.plan.monthlySessionLimit || 0,
      totalEvents,
      usagePercent: company?.plan.monthlySessionLimit
        ? Math.round((monthlySessions / company.plan.monthlySessionLimit) * 100)
        : 0,
    };
  }

  async getSessionsByDay(companyId: string, from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const sessions = await this.prisma.session.findMany({
      where: {
        companyId,
        startedAt: { gte: fromDate, lte: toDate },
      },
      select: { startedAt: true },
      orderBy: { startedAt: 'asc' },
    });

    const byDay: Record<string, number> = {};
    sessions.forEach((s) => {
      const day = s.startedAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return Object.entries(byDay).map(([date, count]) => ({ date, count }));
  }

  async getTopProducts(companyId: string, limit = 10) {
    const results = await this.prisma.session.groupBy({
      by: ['productId', 'sku'],
      where: { companyId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return results.map((r) => ({
      productId: r.productId,
      sku: r.sku,
      sessions: r._count.id,
    }));
  }

  async getEventBreakdown(companyId: string) {
    const results = await this.prisma.event.groupBy({
      by: ['type'],
      where: { companyId },
      _count: { id: true },
    });

    return results.map((r) => ({
      type: r.type,
      count: r._count.id,
    }));
  }
}
