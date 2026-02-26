import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload, Role } from '@ar-core/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('بريد إلكتروني أو كلمة مرور غير صحيحة');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('بريد إلكتروني أو كلمة مرور غير صحيحة');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      companyId: user.companyId,
    };

    const token = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
      token,
    };
  }

  async register(data: { email: string; password: string; name: string; companyName: string; companySlug: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('البريد الإلكتروني مسجل مسبقاً');

    const existingSlug = await this.prisma.company.findUnique({ where: { slug: data.companySlug } });
    if (existingSlug) throw new ConflictException('رابط الشركة مستخدم مسبقاً');

    const starterPlan = await this.prisma.plan.findFirst({ where: { code: 'starter' } });
    if (!starterPlan) throw new Error('Default plan not found');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          slug: data.companySlug,
          planId: starterPlan.id,
          status: 'active',
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          role: Role.COMPANY_OWNER,
          companyId: company.id,
        },
      });

      return { user, company };
    });

    const payload: JwtPayload = {
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role as Role,
      companyId: result.user.companyId,
    };

    const token = this.jwtService.sign(payload);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        companyId: result.user.companyId,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        slug: result.company.slug,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: { include: { plan: true } } },
    });
    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            slug: user.company.slug,
            status: user.company.status,
            plan: {
              code: user.company.plan.code,
              nameAr: user.company.plan.nameAr,
              nameEn: user.company.plan.nameEn,
            },
          }
        : null,
    };
  }

  generateViewerToken(companyId: string, productId: string, sku: string): string {
    return this.jwtService.sign(
      { type: 'viewer', companyId, productId, sku },
      { expiresIn: '1h' },
    );
  }

  verifyViewerToken(token: string): { companyId: string; productId: string; sku: string } {
    try {
      const decoded = this.jwtService.verify(token);
      if (decoded.type !== 'viewer') throw new UnauthorizedException();
      return { companyId: decoded.companyId, productId: decoded.productId, sku: decoded.sku };
    } catch {
      throw new UnauthorizedException('Invalid or expired viewer token');
    }
  }
}
