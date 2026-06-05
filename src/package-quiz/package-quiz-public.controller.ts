import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { PackageQuizService } from './package-quiz.service';
import { RecommendPackageQuizDto } from './dto/recommend-package-quiz.dto';
import { PackageQuizQueryDto } from './dto/package-quiz-query.dto';
import {
  ApiErrorResponseDto,
  PackageQuizPublicDto,
  PackageQuizRecommendResponseDto,
} from '../swagger/swagger-responses.dto';

@ApiTags('Public — Package quiz')
@Controller('package-quiz')
export class PackageQuizPublicController {
  constructor(private readonly quiz: PackageQuizService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy bộ câu hỏi gợi ý (wizard 2–3 câu)',
    description:
      'Query `code=home-needs`. Trả questions[], mỗi câu có multiSelect và options (label, icon, code).',
  })
  @ApiQuery({ name: 'code', required: false, example: 'home-needs' })
  @ApiOkResponse({ type: PackageQuizPublicDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getActive(@Query() query: PackageQuizQueryDto) {
    return this.quiz.findActivePublic(query.code);
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Nộp đủ câu trả lời → gợi ý loại gói + danh sách gói',
    description:
      'Body `answers[]` (2–3 câu). Response: recommendedTypes, packages[], resultsPath cho FE navigate.',
  })
  @ApiOkResponse({ type: PackageQuizRecommendResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  recommend(@Body() dto: RecommendPackageQuizDto) {
    return this.quiz.recommend(dto);
  }
}
