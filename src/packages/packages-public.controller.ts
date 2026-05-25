import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { PublicPackagesQueryDto } from './dto/public-packages.query.dto';
import { toPackageFeList, toPackageFeResponse } from './package-fe.mapper';

@ApiTags('Public — Packages')
@Controller('packages')
export class PackagesPublicController {
  constructor(private readonly packages: PackagesService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách gói (public, isActive=true)',
    description: 'Response theo contract FE: id, code, tagline, heroImage, metadata, …',
  })
  async list(@Query() query: PublicPackagesQueryDto) {
    const docs = await this.packages.findActivePublic(query.type);
    return toPackageFeList(docs as Record<string, unknown>[]);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Chi tiết gói theo code (contract FE)' })
  async byCode(@Param('code') code: string) {
    const doc = await this.packages.findOneActiveByCode(code);
    return toPackageFeResponse(doc as Record<string, unknown>);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết gói theo id (contract FE)' })
  async byId(@Param('id') id: string) {
    const doc = await this.packages.findOneActiveById(id);
    return toPackageFeResponse(doc as Record<string, unknown>);
  }
}
