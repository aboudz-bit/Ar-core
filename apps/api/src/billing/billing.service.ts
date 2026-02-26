import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PRICE_PER_SESSION_SAR = 0.05;

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getInvoices(companyId: string) {
    return this.prisma.invoice.findMany({
      where: { companyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getCurrentMonthUsage(companyId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const sessionsCount = await this.prisma.session.count({
      where: { companyId, startedAt: { gte: monthStart } },
    });

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });

    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      sessionsCount,
      limit: company?.plan.monthlySessionLimit || 0,
      estimatedAmount: sessionsCount * PRICE_PER_SESSION_SAR,
      currency: 'SAR',
    };
  }

  async generateMonthlyInvoice(companyId: string, month: number, year: number) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const sessionsCount = await this.prisma.session.count({
      where: {
        companyId,
        startedAt: { gte: monthStart, lt: monthEnd },
      },
    });

    const amountSar = sessionsCount * PRICE_PER_SESSION_SAR;

    return this.prisma.invoice.upsert({
      where: { companyId_month_year: { companyId, month, year } },
      create: {
        companyId,
        month,
        year,
        sessionsCount,
        amountSar,
        status: 'issued',
      },
      update: {
        sessionsCount,
        amountSar,
        status: 'issued',
      },
    });
  }
}
