import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ViewerService {
  constructor(private prisma: PrismaService) {}

  async getViewerData(companySlug: string, sku: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
      include: { plan: true },
    });
    if (!company) throw new NotFoundException('الشركة غير موجودة');
    if (company.status !== 'active') throw new ForbiddenException('حساب الشركة معلّق');

    const product = await this.prisma.product.findFirst({
      where: { companyId: company.id, sku, status: 'active' },
      include: { assets: true, configs: true },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    return { company, product };
  }

  async startSession(companyId: string, productId: string, sku: string, viewerType: string, device: object, referrer?: string) {
    // Enforce monthly session limit
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });
    if (!company) throw new NotFoundException();

    if (company.plan.monthlySessionLimit > 0) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const sessionCount = await this.prisma.session.count({
        where: {
          companyId,
          startedAt: { gte: monthStart },
        },
      });

      if (sessionCount >= company.plan.monthlySessionLimit) {
        throw new ForbiddenException('تم الوصول إلى الحد الأقصى لعدد الجلسات الشهرية');
      }
    }

    return this.prisma.session.create({
      data: {
        companyId,
        productId,
        sku,
        viewerType,
        deviceJson: device,
        referrer,
      },
    });
  }

  async endSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return;

    const durationSec = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { endedAt: new Date(), durationSec },
    });
  }

  async logEvent(companyId: string, sessionId: string, type: string, payload: object) {
    return this.prisma.event.create({
      data: {
        companyId,
        sessionId,
        type,
        payloadJson: payload,
      },
    });
  }
}
