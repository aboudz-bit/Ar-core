import { Controller, Post, Get, Delete, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyGuard } from '../common/guards/company.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, AssetType } from '@ar-core/shared';

@Controller('assets')
@UseGuards(AuthGuard('jwt'), CompanyGuard, RolesGuard)
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Post('upload')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async upload(
    @CurrentUser('companyId') companyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('productId') productId: string,
    @Query('type') type: string,
  ) {
    if (!file) throw new BadRequestException('الملف مطلوب');
    if (!productId) throw new BadRequestException('معرف المنتج مطلوب');
    if (!Object.values(AssetType).includes(type as AssetType)) {
      throw new BadRequestException('نوع الأصل غير صالح');
    }

    const asset = await this.assetsService.upload(companyId, productId, type, file);
    return { success: true, data: asset };
  }

  @Get('product/:productId')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.COMPANY_STAFF)
  async findByProduct(
    @CurrentUser('companyId') companyId: string,
    @Param('productId') productId: string,
  ) {
    const assets = await this.assetsService.findByProduct(companyId, productId);
    return { success: true, data: assets };
  }

  @Delete(':id')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  async delete(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    await this.assetsService.delete(companyId, id);
    return { success: true, message: 'تم حذف الملف' };
  }
}
