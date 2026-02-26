import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

function extractJwtFromCookieOrHeader(req: Request): string | null {
  // Try cookie first
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  // Then Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractJwtFromCookieOrHeader]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'ar-core-dev-jwt-secret',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      name: user.name,
    };
  }
}
