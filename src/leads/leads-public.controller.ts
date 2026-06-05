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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LookupLeadsByPhoneQueryDto } from './dto/lookup-leads-by-phone.query.dto';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt.guard';
import { RequestUser } from '../auth/jwt.types';
import {
  ApiErrorResponseDto,
  LeadCreateResponseDto,
  LeadHistoryResponseDto,
  LeadPublicItemDto,
} from '../swagger/swagger-responses.dto';

@ApiTags('Public — Leads')
@Controller('leads')
export class LeadsPublicController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Gửi đơn đăng ký / tư vấn',
    description: 'Optional Bearer khách → gắn customerId. Rate limit theo IP/SĐT.',
  })
  @ApiCreatedResponse({ type: LeadCreateResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
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
    summary: 'Tra cứu lịch sử đăng ký theo SĐT (không đăng nhập)',
  })
  @ApiOkResponse({ type: LeadHistoryResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  historyByPhone(@Query() query: LookupLeadsByPhoneQueryDto, @Req() req: Request) {
    const ip = (req.ip || req.socket?.remoteAddress || '').toString();
    return this.leads.findHistoryByPhone(query.phone, { ip });
  }

  @Get('history/:id')
  @ApiOperation({ summary: 'Chi tiết một đơn (SĐT phải khớp)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @ApiOkResponse({ type: LeadPublicItemDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  historyDetail(
    @Param('id') id: string,
    @Query() query: LookupLeadsByPhoneQueryDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket?.remoteAddress || '').toString();
    return this.leads.findOnePublicByIdAndPhone(id, query.phone, { ip });
  }
}
