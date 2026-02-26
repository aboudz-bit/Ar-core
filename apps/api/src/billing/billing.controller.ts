import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyGuard } from '../common/guards/company.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@ar-core/shared';

@Controller('billing')
@UseGuards(AuthGuard('jwt'), CompanyGuard, RolesGuard)
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('invoices')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  async getInvoices(@CurrentUser('companyId') companyId: string) {
    const invoices = await this.billingService.getInvoices(companyId);
    return { success: true, data: invoices };
  }

  @Get('current')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  async getCurrentUsage(@CurrentUser('companyId') companyId: string) {
    const usage = await this.billingService.getCurrentMonthUsage(companyId);
    return { success: true, data: usage };
  }
}
