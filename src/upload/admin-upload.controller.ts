import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { CloudinaryService } from './cloudinary.service';
import { UploadFromUrlDto } from './dto/upload-from-url.dto';

const MAX_BYTES = 5 * 1024 * 1024;

@ApiTags('Admin — Upload (Cloudinary)')
@ApiBearerAuth('access-token')
@Controller('admin/uploads')
@UseGuards(JwtAccessAuthGuard, AdminRoleGuard)
export class AdminUploadController {
  private readonly logger = new Logger(AdminUploadController.name);

  constructor(private readonly cloudinary: CloudinaryService) {}

  @Get('health')
  @ApiOperation({ summary: 'Kiểm tra Cloudinary đã cấu hình (không upload)' })
  health() {
    return {
      configured: this.cloudinary.isEnabled(),
      folder: this.cloudinary.defaultFolder(),
      hint: 'Chạy npm run test:cloudinary để thử upload thật từ máy chủ',
    };
  }

  @Post('image')
  @ApiOperation({
    summary: 'Upload ảnh từ máy (multipart)',
    description:
      'Field form: `file`. Trả URL Cloudinary — dán vào heroImage / accentImage khi tạo/sửa gói.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'packages/heroes' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BYTES },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('folder') folder?: string,
  ) {
    if (!file?.buffer?.length) {
      const url = this.cloudinary.fallbackHeroImageUrl();
      this.logger.warn('Thiếu file ảnh — trả URL dự phòng');
      return { url, fallback: true };
    }
    try {
      const result = await this.cloudinary.uploadBuffer(file.buffer, file.mimetype, {
        folder: folder?.trim() || undefined,
        filename: file.originalname?.replace(/\.[^.]+$/, ''),
        originalname: file.originalname,
      });
      return { ...this.cloudinary.toPublicPayload(result), fallback: false };
    } catch (error) {
      const url = this.cloudinary.fallbackHeroImageUrl();
      this.logger.warn('Cloudinary upload thất bại — dùng ảnh dự phòng');
      this.logger.debug(error);
      return { url, fallback: true };
    }
  }

  @Post('from-url')
  @ApiOperation({
    summary: 'Upload ảnh từ URL công khai',
    description: 'BE tải ảnh từ URL và đưa lên Cloudinary. Dùng khi admin dán link ảnh có sẵn.',
  })
  async uploadFromUrl(@Body() dto: UploadFromUrlDto) {
    const result = await this.cloudinary.uploadFromUrl(dto.url, dto.folder?.trim());
    return this.cloudinary.toPublicPayload(result);
  }
}
