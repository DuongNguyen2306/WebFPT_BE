import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { PublicPackagesQueryDto } from './dto/public-packages.query.dto';
import { toPackageFeList, toPackageFeResponse } from './package-fe.mapper';
import { ApiErrorResponseDto, PackagePublicDto } from '../swagger/swagger-responses.dto';

@ApiTags('Public — Packages')
@Controller('packages')
export class PackagesPublicController {
  constructor(private readonly packages: PackagesService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách gói đang bán (isActive=true)',
    description:
      'Query `type`: INTERNET | SPEEDX | FPT_PLAY | CAMERA | SERVICE. Response: mảng PackagePublicDto.',
  })
  @ApiOkResponse({ type: PackagePublicDto, isArray: true })
  async list(@Query() query: PublicPackagesQueryDto) {
    const docs = await this.packages.findActivePublic(query.type);
    return toPackageFeList(docs as Record<string, unknown>[]);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Chi tiết gói theo code (vd. internet-giga)' })
  @ApiParam({ name: 'code', example: 'internet-giga' })
  @ApiOkResponse({ type: PackagePublicDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async byCode(@Param('code') code: string) {
    const doc = await this.packages.findOneActiveByCode(code);
    return toPackageFeResponse(doc as Record<string, unknown>);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết gói theo MongoDB id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: PackagePublicDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async byId(@Param('id') id: string) {
    const doc = await this.packages.findOneActiveById(id);
    return toPackageFeResponse(doc as Record<string, unknown>);
  }
}
