import { Controller, Get, Post, Delete, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTokensService } from './api-tokens.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyGuard } from '../common/guards/company.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Role, createApiTokenSchema, CreateApiTokenInput } from '@ar-core/shared';

@Controller('api-tokens')
@UseGuards(AuthGuard('jwt'), CompanyGuard, RolesGuard)
export class ApiTokensController {
  constructor(private apiTokensService: ApiTokensService) {}

  @Get()
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  async findAll(@CurrentUser('companyId') companyId: string) {
    const tokens = await this.apiTokensService.findAll(companyId);
    return { success: true, data: tokens };
  }

  @Post()
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @UsePipes(new ZodValidationPipe(createApiTokenSchema))
  async create(@CurrentUser('companyId') companyId: string, @Body() body: CreateApiTokenInput) {
    const token = await this.apiTokensService.create(companyId, body);
    return { success: true, data: token };
  }

  @Delete(':id')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  async revoke(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    await this.apiTokensService.revoke(companyId, id);
    return { success: true, message: 'تم إلغاء التوكن' };
  }
}
