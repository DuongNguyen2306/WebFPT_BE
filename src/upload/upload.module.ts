import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { AdminUploadController } from './admin-upload.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [AdminUploadController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadModule {}
