import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@ApiTags('Admin — FAQs')
@ApiBearerAuth('access-token')
@Controller('admin/faqs')
@UseGuards(JwtAccessAuthGuard, AdminRoleGuard)
export class AdminFaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách FAQ (admin, gồm cả ẩn)' })
  list() {
    return this.faqs.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết FAQ' })
  getOne(@Param('id') id: string) {
    return this.faqs.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo FAQ mới' })
  create(@Body() dto: CreateFaqDto) {
    return this.faqs.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật FAQ' })
  update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqs.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa FAQ' })
  remove(@Param('id') id: string) {
    return this.faqs.remove(id);
  }
}
