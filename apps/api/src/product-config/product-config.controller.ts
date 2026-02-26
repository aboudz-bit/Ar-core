import { Controller, Get, Put, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductConfigService } from './product-config.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyGuard } from '../common/guards/company.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Role, upsertProductConfigSchema, UpsertProductConfigInput } from '@ar-core/shared';

@Controller('product-config')
@UseGuards(AuthGuard('jwt'), CompanyGuard, RolesGuard)
export class ProductConfigController {
  constructor(private configService: ProductConfigService) {}

  @Get(':productId')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.COMPANY_STAFF)
  async getByProduct(
    @CurrentUser('companyId') companyId: string,
    @Param('productId') productId: string,
  ) {
    const configs = await this.configService.getByProduct(companyId, productId);
    return { success: true, data: configs };
  }

  @Put(':productId')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @UsePipes(new ZodValidationPipe(upsertProductConfigSchema))
  async upsert(
    @CurrentUser('companyId') companyId: string,
    @Param('productId') productId: string,
    @Body() body: UpsertProductConfigInput,
  ) {
    const config = await this.configService.upsert(companyId, productId, body);
    return { success: true, data: config };
  }
}
