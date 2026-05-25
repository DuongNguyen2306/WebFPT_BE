import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminPackagesController } from './admin-packages.controller';
import { AdminLeadsController } from './admin-leads.controller';
import { AuthModule } from '../auth/auth.module';
import { PackagesModule } from '../packages/packages.module';
import { LeadsModule } from '../leads/leads.module';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from '../upload/upload.module';
import { AdminPackagesService } from './admin-packages.service';

@Module({
  imports: [ConfigModule, AuthModule, PackagesModule, LeadsModule, UploadModule],
  controllers: [AdminAuthController, AdminPackagesController, AdminLeadsController],
  providers: [AdminPackagesService],
})
export class AdminModule {}
