import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { toBannerFeList } from './banner-fe.mapper';

@ApiTags('Banners')
@Controller('banners')
export class BannersPublicController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách banner carousel trang chủ (public)' })
  async list() {
    const docs = await this.banners.findActivePublic();
    return { items: toBannerFeList(docs as Record<string, unknown>[]) };
  }
}
