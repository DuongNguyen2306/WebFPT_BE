import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './admin.schema';
import { AdminsService } from './admins.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }])],
  providers: [AdminsService],
  exports: [AdminsService, MongooseModule],
})
export class AdminsModule {}
