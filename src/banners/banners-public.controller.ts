import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { toBannerFeList } from './banner-fe.mapper';
import { BannerListResponseDto } from '../swagger/swagger-responses.dto';

@ApiTags('Public — Banners')
@Controller('banners')
export class BannersPublicController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Banner carousel trang chủ (isActive=true)' })
  @ApiOkResponse({ type: BannerListResponseDto })
  async list() {
    const docs = await this.banners.findActivePublic();
    return { items: toBannerFeList(docs as Record<string, unknown>[]) };
  }
}
