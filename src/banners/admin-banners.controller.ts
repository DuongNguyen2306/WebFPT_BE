import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@ApiTags('Admin — Banners')
@ApiBearerAuth('access-token')
@Controller('admin/banners')
@UseGuards(JwtAccessAuthGuard, AdminRoleGuard)
export class AdminBannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách banner (admin)' })
  list() {
    return this.banners.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết banner' })
  getOne(@Param('id') id: string) {
    return this.banners.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo banner trang chủ (ảnh URL từ /admin/uploads/image)' })
  create(@Body() dto: CreateBannerDto) {
    return this.banners.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật banner' })
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.banners.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa banner' })
  remove(@Param('id') id: string) {
    return this.banners.remove(id);
  }
}
