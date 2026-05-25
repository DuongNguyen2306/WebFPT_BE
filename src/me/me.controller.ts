import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersService } from '../customers/customers.service';
import { LeadsService } from '../leads/leads.service';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { CustomerRoleGuard } from '../guards/customer-role.guard';
import { RequestUser } from '../auth/jwt.types';
import { AppRole } from '../common/enums';
import { UpdateMeDto } from './dto/update-me.dto';
import { PaginationQueryDto } from '../common/dto/pagination.query.dto';

@ApiTags('Me (Khách)')
@ApiBearerAuth('access-token')
@Controller('me')
@UseGuards(JwtAccessAuthGuard, CustomerRoleGuard)
export class MeController {
  constructor(
    private readonly customers: CustomersService,
    private readonly leads: LeadsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Thông tin profile khách' })
  async getMe(@Req() req: { user: RequestUser }) {
    const c = await this.customers.findById(req.user.sub);
    if (!c) {
      throw new UnauthorizedException();
    }
    return {
      id: c._id.toString(),
      username: c.username,
      fullName: c.fullName,
      email: c.email ?? null,
      defaultAddress: c.defaultAddress ?? null,
      role: AppRole.CUSTOMER,
      status: c.status,
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật profile' })
  async patchMe(@Req() req: { user: RequestUser }, @Body() dto: UpdateMeDto) {
    const updated = await this.customers.updateProfile(req.user.sub, {
      fullName: dto.fullName,
      defaultAddress: dto.defaultAddress,
      email: dto.email,
    });
    if (!updated) {
      throw new UnauthorizedException();
    }
    return {
      id: updated._id.toString(),
      username: updated.username,
      fullName: updated.fullName,
      email: updated.email ?? null,
      defaultAddress: updated.defaultAddress ?? null,
      role: AppRole.CUSTOMER,
      status: updated.status,
    };
  }

  @Get('leads')
  @ApiOperation({ summary: 'Lead đã gửi khi đã đăng nhập (customerId)' })
  async myLeads(@Req() req: { user: RequestUser }, @Query() q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    return this.leads.findForCustomer(req.user.sub, page, limit);
  }
}
