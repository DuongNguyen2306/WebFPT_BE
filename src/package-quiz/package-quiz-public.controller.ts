import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PackageQuizService } from './package-quiz.service';
import { RecommendPackageQuizDto } from './dto/recommend-package-quiz.dto';

@ApiTags('Public — Package quiz')
@Controller('package-quiz')
export class PackageQuizPublicController {
  constructor(private readonly quiz: PackageQuizService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy bộ câu hỏi gợi ý loại gói (mặc định: quiz visible đầu tiên)',
  })
  getActive(@Query('code') code?: string) {
    return this.quiz.findActivePublic(code);
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Gửi đủ 2–3 câu (answers[]) → loại gói + danh sách gói gợi ý + resultsPath cho FE',
  })
  recommend(@Body() dto: RecommendPackageQuizDto) {
    return this.quiz.recommend(dto);
  }
}
