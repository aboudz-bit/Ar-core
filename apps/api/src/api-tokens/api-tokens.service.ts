import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiTokensService {
  constructor(private prisma: PrismaService) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async findAll(companyId: string) {
    return this.prisma.apiToken.findMany({
      where: { companyId, revokedAt: null },
      select: {
        id: true,
        name: true,
        scopesJson: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(companyId: string, data: { name: string; scopesJson: string[] }) {
    const rawToken = `arc_${randomBytes(32).toString('hex')}`;
    const tokenHash = this.hashToken(rawToken);

    const token = await this.prisma.apiToken.create({
      data: {
        companyId,
        name: data.name,
        tokenHash,
        scopesJson: data.scopesJson,
      },
      select: {
        id: true,
        name: true,
        scopesJson: true,
        createdAt: true,
      },
    });

    // Return raw token only once at creation
    return { ...token, rawToken };
  }

  async revoke(companyId: string, tokenId: string) {
    const token = await this.prisma.apiToken.findFirst({
      where: { id: tokenId, companyId, revokedAt: null },
    });
    if (!token) throw new NotFoundException('التوكن غير موجود');

    await this.prisma.apiToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    return { revoked: true };
  }

  async validateToken(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    const token = await this.prisma.apiToken.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { company: true },
    });

    if (!token) return null;

    // Update lastUsedAt
    await this.prisma.apiToken.update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    });

    return token;
  }
}
