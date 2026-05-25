import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Package, PackageSchema } from './package.schema';
import { PackagesService } from './packages.service';
import { PackagesPublicController } from './packages-public.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Package.name, schema: PackageSchema }])],
  controllers: [PackagesPublicController],
  providers: [PackagesService],
  exports: [PackagesService, MongooseModule],
})
export class PackagesModule {}
