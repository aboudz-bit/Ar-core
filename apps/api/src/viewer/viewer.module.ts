import { Module } from '@nestjs/common';
import { ViewerService } from './viewer.service';
import { ViewerController } from './viewer.controller';
import { AuthModule } from '../auth/auth.module';
import { ApiTokensModule } from '../api-tokens/api-tokens.module';

@Module({
  imports: [AuthModule, ApiTokensModule],
  controllers: [ViewerController],
  providers: [ViewerService],
})
export class ViewerModule {}
