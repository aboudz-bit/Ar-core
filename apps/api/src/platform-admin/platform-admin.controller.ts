import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlatformAdminService } from './platform-admin.service';
import { BillingService } from '../billing/billing.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@ar-core/shared';

@Controller('platform')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.PLATFORM_ADMIN)
export class PlatformAdminController {
  constructor(
    private platformService: PlatformAdminService,
    private billingService: BillingService,
  ) {}

  @Get('stats')
  async stats() {
    const data = await this.platformService.getPlatformStats();
    return { success: true, data };
  }

  @Get('plans')
  async plans() {
    const data = await this.platformService.getPlans();
    return { success: true, data };
  }

  @Get('companies')
  async companies(@Query('page') page?: string, @Query('limit') limit?: string) {
    const data = await this.platformService.getAllCompanies(Number(page) || 1, Number(limit) || 20);
    return { success: true, ...data };
  }

  @Get('companies/:id')
  async companyDetails(@Param('id') id: string) {
    const data = await this.platformService.getCompanyDetails(id);
    return { success: true, data };
  }

  @Patch('companies/:id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    const data = await this.platformService.updateCompanyStatus(id, status);
    return { success: true, data };
  }

  @Patch('companies/:id/plan')
  async updatePlan(@Param('id') id: string, @Body('planId') planId: string) {
    const data = await this.platformService.updateCompanyPlan(id, planId);
    return { success: true, data };
  }

  @Get('companies/:id/invoices')
  async companyInvoices(@Param('id') id: string) {
    const data = await this.billingService.getInvoices(id);
    return { success: true, data };
  }
}
