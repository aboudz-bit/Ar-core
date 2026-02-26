import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformAdminService {
  constructor(private prisma: PrismaService) {}

  async getAllCompanies(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        include: {
          plan: true,
          _count: { select: { users: true, products: true, sessions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCompanyDetails(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        plan: true,
        users: { select: { id: true, email: true, name: true, role: true, createdAt: true } },
        _count: { select: { products: true, sessions: true, apiTokens: true } },
      },
    });
    if (!company) throw new NotFoundException('الشركة غير موجودة');
    return company;
  }

  async updateCompanyStatus(companyId: string, status: string) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { status },
    });
  }

  async updateCompanyPlan(companyId: string, planId: string) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { planId },
      include: { plan: true },
    });
  }

  async getPlans() {
    return this.prisma.plan.findMany({ orderBy: { monthlySessionLimit: 'asc' } });
  }

  async getPlatformStats() {
    const [companies, users, products, sessions] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.session.count(),
    ]);

    return { companies, users, products, sessions };
  }
}
