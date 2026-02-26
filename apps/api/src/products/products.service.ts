import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { companyId },
        include: { assets: true, configs: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { companyId } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
      include: { assets: true, configs: true },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    return product;
  }

  async create(companyId: string, data: { sku: string; nameAr: string; nameEn: string }) {
    // Check product limit
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });

    if (company && company.plan.productLimit > 0) {
      const productCount = await this.prisma.product.count({ where: { companyId } });
      if (productCount >= company.plan.productLimit) {
        throw new ForbiddenException('تم الوصول إلى الحد الأقصى لعدد المنتجات في خطتك');
      }
    }

    return this.prisma.product.create({
      data: { ...data, companyId },
      include: { assets: true, configs: true },
    });
  }

  async update(companyId: string, productId: string, data: { sku?: string; nameAr?: string; nameEn?: string; status?: string }) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, companyId } });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    return this.prisma.product.update({
      where: { id: productId },
      data,
      include: { assets: true, configs: true },
    });
  }

  async delete(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, companyId } });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    await this.prisma.$transaction([
      this.prisma.event.deleteMany({ where: { session: { productId } } }),
      this.prisma.session.deleteMany({ where: { productId } }),
      this.prisma.productConfig.deleteMany({ where: { productId } }),
      this.prisma.asset.deleteMany({ where: { productId } }),
      this.prisma.product.delete({ where: { id: productId } }),
    ]);

    return { deleted: true };
  }
}
