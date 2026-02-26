import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/services/storage.service';

const ALLOWED_MIMES = [
  'model/gltf-binary',
  'application/octet-stream', // GLB files often have this MIME
  'model/vnd.usdz+zip',
  'model/usd',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async upload(companyId: string, productId: string, type: string, file: Express.Multer.File) {
    // Validate product belongs to company
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('حجم الملف يتجاوز الحد المسموح (50 ميجابايت)');
    }

    // Validate MIME type (allow common GLB/USDZ mimes)
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      const ext = file.originalname.toLowerCase();
      if (!ext.endsWith('.glb') && !ext.endsWith('.usdz')) {
        throw new BadRequestException('نوع الملف غير مدعوم. يُسمح فقط بـ GLB و USDZ');
      }
    }

    const stored = await this.storage.save(file, `${companyId}/assets`);

    return this.prisma.asset.create({
      data: {
        companyId,
        productId,
        type,
        path: stored.path,
        sizeBytes: stored.sizeBytes,
      },
    });
  }

  async findByProduct(companyId: string, productId: string) {
    return this.prisma.asset.findMany({
      where: { companyId, productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(companyId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, companyId } });
    if (!asset) throw new NotFoundException('الملف غير موجود');

    await this.storage.delete(asset.path);
    await this.prisma.asset.delete({ where: { id: assetId } });

    return { deleted: true };
  }
}
