import { Controller, Get, Patch, Body, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompanyService } from './company.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyGuard } from '../common/guards/company.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Role, updateCompanySchema, UpdateCompanyInput } from '@ar-core/shared';

@Controller('company')
@UseGuards(AuthGuard('jwt'), CompanyGuard, RolesGuard)
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.COMPANY_STAFF)
  async getCompany(@CurrentUser('companyId') companyId: string) {
    const company = await this.companyService.findById(companyId);
    return { success: true, data: company };
  }

  @Patch()
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @UsePipes(new ZodValidationPipe(updateCompanySchema))
  async updateCompany(
    @CurrentUser('companyId') companyId: string,
    @Body() body: UpdateCompanyInput,
  ) {
    const company = await this.companyService.update(companyId, body);
    return { success: true, data: company };
  }

  @Get('settings')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  async getSettings(@CurrentUser('companyId') companyId: string) {
    const settings = await this.companyService.getSettings(companyId);
    return { success: true, data: settings };
  }
}
