import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyGuard } from '../common/guards/company.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@ar-core/shared';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'), CompanyGuard, RolesGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.COMPANY_STAFF)
  async dashboard(@CurrentUser('companyId') companyId: string) {
    const stats = await this.analyticsService.getDashboardStats(companyId);
    return { success: true, data: stats };
  }

  @Get('sessions-by-day')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.COMPANY_STAFF)
  async sessionsByDay(
    @CurrentUser('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const data = await this.analyticsService.getSessionsByDay(companyId, from, to);
    return { success: true, data };
  }

  @Get('top-products')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.COMPANY_STAFF)
  async topProducts(@CurrentUser('companyId') companyId: string) {
    const data = await this.analyticsService.getTopProducts(companyId);
    return { success: true, data };
  }

  @Get('events')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.COMPANY_STAFF)
  async eventBreakdown(@CurrentUser('companyId') companyId: string) {
    const data = await this.analyticsService.getEventBreakdown(companyId);
    return { success: true, data };
  }
}
