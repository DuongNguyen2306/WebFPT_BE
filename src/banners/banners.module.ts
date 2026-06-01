import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Banner, BannerSchema } from './banner.schema';
import { BannersService } from './banners.service';
import { BannersPublicController } from './banners-public.controller';
import { AdminBannersController } from './admin-banners.controller';
import { PackagesModule } from '../packages/packages.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Banner.name, schema: BannerSchema }]),
    PackagesModule,
    AuthModule,
  ],
  controllers: [BannersPublicController, AdminBannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
