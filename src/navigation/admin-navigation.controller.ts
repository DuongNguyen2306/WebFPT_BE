import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { NavigationService } from './navigation.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { ReorderNavigationDto } from './dto/reorder-navigation.dto';

@ApiTags('Admin — Navigation')
@ApiBearerAuth('access-token')
@Controller('admin/navigation')
@UseGuards(JwtAccessAuthGuard, AdminRoleGuard)
export class AdminNavigationController {
  constructor(private readonly navigation: NavigationService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách nhóm menu (admin, gồm cả ẩn)' })
  list() {
    return this.navigation.findAllAdmin();
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Sắp xếp lại thứ tự các cột menu (trái → phải)' })
  reorder(@Body() dto: ReorderNavigationDto) {
    return this.navigation.reorderGroups(dto.ids);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết nhóm menu' })
  getOne(@Param('id') id: string) {
    return this.navigation.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo nhóm menu mới' })
  create(@Body() dto: CreateMenuDto) {
    return this.navigation.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật toàn bộ nhóm menu' })
  update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.navigation.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật một phần nhóm menu' })
  patch(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.navigation.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa nhóm menu' })
  remove(@Param('id') id: string) {
    return this.navigation.remove(id);
  }
}
