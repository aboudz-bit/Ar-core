import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { AssetsModule } from './assets/assets.module';
import { ProductConfigModule } from './product-config/product-config.module';
import { ApiTokensModule } from './api-tokens/api-tokens.module';
import { ViewerModule } from './viewer/viewer.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BillingModule } from './billing/billing.module';
import { PlatformAdminModule } from './platform-admin/platform-admin.module';
import { StorageModule } from './common/services/storage.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AuthModule,
    CompanyModule,
    UsersModule,
    ProductsModule,
    AssetsModule,
    ProductConfigModule,
    ApiTokensModule,
    ViewerModule,
    AnalyticsModule,
    BillingModule,
    PlatformAdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
