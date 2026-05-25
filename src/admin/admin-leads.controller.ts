import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeadsService } from '../leads/leads.service';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { AdminLeadsQueryDto } from './dto/admin-leads.query.dto';
import { PatchAdminLeadDto } from './dto/patch-admin-lead.dto';

@ApiTags('Admin — Leads')
@ApiBearerAuth('access-token')
@Controller('admin/leads')
@UseGuards(JwtAccessAuthGuard, AdminRoleGuard)
export class AdminLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách lead (filter + phân trang)' })
  list(@Query() query: AdminLeadsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return this.leads.findAdminList({
      status: query.status,
      from: query.from,
      to: query.to,
      phone: query.phone,
      page,
      limit,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật trạng thái / ghi chú lead' })
  patch(@Param('id') id: string, @Body() dto: PatchAdminLeadDto) {
    return this.leads.updateAdmin(id, dto);
  }
}
