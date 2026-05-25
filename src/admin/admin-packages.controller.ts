import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { PackagesService } from '../packages/packages.service';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { AdminPackagesQueryDto } from './dto/admin-packages.query.dto';
import { CreatePackageDto, UpdatePackageDto } from './dto/admin-package.dto';
import { normalizePackageInput, toPackageFeList, toPackageFeResponse } from '../packages/package-fe.mapper';
import { AdminPackagesService } from './admin-packages.service';
import { parseAndValidatePackageForm } from './utils/parse-package-form.util';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@ApiTags('Admin — Packages')
@ApiBearerAuth('access-token')
@Controller('admin/packages')
@UseGuards(JwtAccessAuthGuard, AdminRoleGuard)
export class AdminPackagesController {
  constructor(
    private readonly packages: PackagesService,
    private readonly adminPackages: AdminPackagesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách gói (admin, filter + phân trang)' })
  async list(@Query() query: AdminPackagesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.packages.findAdminList({
      type: query.type,
      isActive: query.isActive,
      page,
      limit,
    });
    return {
      ...result,
      items: toPackageFeList(result.items as Record<string, unknown>[]),
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo gói (JSON)',
    description:
      'Body JSON. Ảnh: gửi heroImage/imageUrl (URL Cloudinary) hoặc dùng POST /admin/packages/with-image (multipart).',
  })
  async create(@Body() dto: CreatePackageDto) {
    return this.adminPackages.createFromJson(dto);
  }

  @Post('with-image')
  @ApiOperation({
    summary: 'Tạo gói + upload ảnh Cloudinary (1 request)',
    description:
      'multipart/form-data: field `file` (ảnh chính, tuỳ chọn), `accentFile` (tuỳ chọn). ' +
      'Nếu Cloudinary lỗi hoặc không gửi file → dùng PACKAGE_FALLBACK_HERO_IMAGE_URL. ' +
      'Các field text: type, code, name, tagline, price, billingCycle, features, …',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'code', 'name', 'billingCycle'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Ảnh hero — thử Cloudinary, lỗi thì ảnh dự phòng' },
        accentFile: { type: 'string', format: 'binary', description: 'Ảnh phụ (tuỳ chọn)' },
        folder: { type: 'string', example: 'telecom-packages/heroes' },
        type: { type: 'string', example: 'INTERNET' },
        category: { type: 'string', example: 'internet', description: 'Alias của type' },
        code: { type: 'string', example: 'internet-giga-new' },
        name: { type: 'string' },
        tagline: { type: 'string' },
        price: { type: 'number', example: 195000 },
        billingCycle: { type: 'string', example: 'MONTHLY' },
        speedLabel: { type: 'string', example: '1 Gbps' },
        speed: { type: 'string', description: 'Alias speedLabel' },
        features: {
          type: 'string',
          example: '["Modem Wi-Fi 6","Hỗ trợ 24/7"]',
        },
        heroImage: { type: 'string', description: 'URL nếu không upload file' },
        metadata: { type: 'string', example: '{"downloadMbps":1000,"uploadMbps":500}' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'accentFile', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES } },
    ),
  )
  async createWithImage(
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; accentFile?: Express.Multer.File[] },
    @Body() body: Record<string, string>,
  ) {
    const dto = await parseAndValidatePackageForm(body);
    return this.adminPackages.createFromMultipart(dto, files, body.folder);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật gói' })
  async update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    const payload = normalizePackageInput(dto as unknown as Record<string, unknown>);
    const doc = await this.packages.updateById(id, payload);
    return toPackageFeResponse(doc.toObject() as unknown as Record<string, unknown>);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete gói',
    description: 'Đặt isActive = false (không xóa document).',
  })
  async remove(@Param('id') id: string) {
    const doc = await this.packages.softDelete(id);
    return toPackageFeResponse(doc.toObject() as unknown as Record<string, unknown>);
  }
}
