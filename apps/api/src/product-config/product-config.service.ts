import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductConfigService {
  constructor(private prisma: PrismaService) {}

  async getByProduct(companyId: string, productId: string) {
    return this.prisma.productConfig.findMany({
      where: { companyId, productId },
    });
  }

  async upsert(companyId: string, productId: string, data: {
    viewerType: string;
    scale?: number;
    rotationOffsetJson?: Record<string, number>;
    positionOffsetJson?: Record<string, number>;
    placementSettingsJson?: Record<string, unknown>;
    tryonSettingsJson?: Record<string, unknown>;
  }) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    return this.prisma.productConfig.upsert({
      where: {
        companyId_productId_viewerType: {
          companyId,
          productId,
          viewerType: data.viewerType,
        },
      },
      create: {
        companyId,
        productId,
        ...data,
      },
      update: data,
    });
  }
}
