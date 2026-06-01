import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LookupLeadsByPhoneQueryDto } from './dto/lookup-leads-by-phone.query.dto';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt.guard';
import { RequestUser } from '../auth/jwt.types';

@ApiTags('Public — Leads')
@Controller('leads')
export class LeadsPublicController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Gửi lead đăng ký / tư vấn',
    description: 'Nếu gửi kèm Bearer hợp lệ (khách), lead sẽ gắn customerId.',
  })
  async create(@Body() dto: CreateLeadDto, @Req() req: Request & { user?: RequestUser }) {
    const ip = (req.ip || req.socket?.remoteAddress || '').toString();
    let customerId: string | undefined;
    if (req.user?.kind === 'customer') {
      customerId = req.user.sub;
    }
    return this.leads.create(dto, { ip, customerId });
  }

  @Get('history')
  @ApiOperation({
    summary: 'Tra cứu lịch sử đăng ký theo số điện thoại (không cần đăng nhập)',
    description:
      'Trả danh sách đơn/lead đã gửi với SĐT đã chuẩn hóa. Có rate limit theo IP và SĐT.',
  })
  historyByPhone(@Query() query: LookupLeadsByPhoneQueryDto, @Req() req: Request) {
    const ip = (req.ip || req.socket?.remoteAddress || '').toString();
    return this.leads.findHistoryByPhone(query.phone, { ip });
  }

  @Get('history/:id')
  @ApiOperation({
    summary: 'Chi tiết một đơn (phải khớp SĐT tra cứu)',
  })
  historyDetail(
    @Param('id') id: string,
    @Query() query: LookupLeadsByPhoneQueryDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket?.remoteAddress || '').toString();
    return this.leads.findOnePublicByIdAndPhone(id, query.phone, { ip });
  }
}
