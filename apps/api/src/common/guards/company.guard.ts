import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@ar-core/shared';

@Injectable()
export class CompanyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    // Platform admins can access everything
    if (user.role === Role.PLATFORM_ADMIN) return true;

    // Other users must have a companyId
    if (!user.companyId) {
      throw new ForbiddenException('No company associated with this user');
    }

    return true;
  }
}
