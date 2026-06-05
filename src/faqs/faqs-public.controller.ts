import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { FaqListResponseDto } from '../swagger/swagger-responses.dto';

@ApiTags('Public — FAQs')
@Controller('faqs')
export class FaqsPublicController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách FAQ (isVisible=true, sort displayOrder)',
  })
  @ApiOkResponse({ type: FaqListResponseDto })
  list() {
    return this.faqs.findVisiblePublic();
  }
}
