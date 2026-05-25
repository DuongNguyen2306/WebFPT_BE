import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
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
}
