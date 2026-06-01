import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';

@ApiTags('Public — FAQs')
@Controller('faqs')
export class FaqsPublicController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách câu hỏi thường gặp (chỉ isVisible: true, theo displayOrder)',
  })
  list() {
    return this.faqs.findVisiblePublic();
  }
}
