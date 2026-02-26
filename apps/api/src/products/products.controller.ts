import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyGuard } from '../common/guards/company.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Role, createProductSchema, updateProductSchema, CreateProductInput, UpdateProductInput } from '@ar-core/shared';

@Controller('products')
@UseGuards(AuthGuard('jwt'), CompanyGuard, RolesGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.COMPANY_STAFF)
  async findAll(
    @CurrentUser('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.productsService.findAll(companyId, Number(page) || 1, Number(limit) || 20);
    return { success: true, ...data };
  }

  @Get(':id')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.COMPANY_STAFF)
  async findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    const product = await this.productsService.findById(companyId, id);
    return { success: true, data: product };
  }

  @Post()
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @UsePipes(new ZodValidationPipe(createProductSchema))
  async create(@CurrentUser('companyId') companyId: string, @Body() body: CreateProductInput) {
    const product = await this.productsService.create(companyId, body);
    return { success: true, data: product };
  }

  @Patch(':id')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  async update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductInput,
  ) {
    const product = await this.productsService.update(companyId, id, body);
    return { success: true, data: product };
  }

  @Delete(':id')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  async delete(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    await this.productsService.delete(companyId, id);
    return { success: true, message: 'تم حذف المنتج' };
  }
}
