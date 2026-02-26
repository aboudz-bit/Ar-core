import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { companyId },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { companyId } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(companyId: string, data: { email: string; password: string; name: string; role: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('البريد الإلكتروني مسجل مسبقاً');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        companyId,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return user;
  }

  async update(companyId: string, userId: string, data: { name?: string; role?: string }) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  async delete(companyId: string, userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }
}
