import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { PackageQuizService } from './package-quiz.service';
import { CreatePackageQuizDto } from './dto/create-package-quiz.dto';
import { UpdatePackageQuizDto } from './dto/update-package-quiz.dto';

@ApiTags('Admin — Package quiz')
@ApiBearerAuth('access-token')
@Controller('admin/package-quiz')
@UseGuards(JwtAccessAuthGuard, AdminRoleGuard)
export class AdminPackageQuizController {
  constructor(private readonly quiz: PackageQuizService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách bộ câu hỏi gợi ý gói' })
  list() {
    return this.quiz.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bộ câu hỏi' })
  getOne(@Param('id') id: string) {
    return this.quiz.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bộ câu hỏi' })
  create(@Body() dto: CreatePackageQuizDto) {
    return this.quiz.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật toàn bộ bộ câu hỏi' })
  update(@Param('id') id: string, @Body() dto: UpdatePackageQuizDto) {
    return this.quiz.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật một phần' })
  patch(@Param('id') id: string, @Body() dto: UpdatePackageQuizDto) {
    return this.quiz.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bộ câu hỏi' })
  remove(@Param('id') id: string) {
    return this.quiz.remove(id);
  }
}
