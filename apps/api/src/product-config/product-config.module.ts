import { Module } from '@nestjs/common';
import { ProductConfigService } from './product-config.service';
import { ProductConfigController } from './product-config.controller';

@Module({
  controllers: [ProductConfigController],
  providers: [ProductConfigService],
  exports: [ProductConfigService],
})
export class ProductConfigModule {}
