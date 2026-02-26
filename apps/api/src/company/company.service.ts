import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!company) throw new NotFoundException('الشركة غير موجودة');
    return company;
  }

  async findBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: { plan: true },
    });
    if (!company) throw new NotFoundException('الشركة غير موجودة');
    return company;
  }

  async update(id: string, data: { name?: string; status?: string; planId?: string }) {
    return this.prisma.company.update({
      where: { id },
      data,
      include: { plan: true },
    });
  }

  async getSettings(companyId: string) {
    return this.findById(companyId);
  }
}
