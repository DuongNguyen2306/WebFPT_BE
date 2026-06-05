import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeadsService } from '../leads/leads.service';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { PatchPackageRegistrationDto } from './dto/patch-package-registration.dto';

@ApiTags('Admin — Package registrations')
@ApiBearerAuth('access-token')
@Controller('admin/package-registrations')
@UseGuards(JwtAccessAuthGuard, AdminRoleGuard)
export class AdminPackageRegistrationsController {
  constructor(private readonly leads: LeadsService) {}

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật đơn đăng ký (chốt gói khác, trạng thái, ghi chú, địa chỉ)',
  })
  patch(@Param('id') id: string, @Body() dto: PatchPackageRegistrationDto) {
    return this.leads.updateAdmin(id, dto);
  }
}
