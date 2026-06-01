import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { QuizAnswerDto } from './quiz-answer.dto';

export class RecommendPackageQuizDto {
  @ApiPropertyOptional({ example: 'home-needs' })
  @IsOptional()
  @IsString()
  quizCode?: string;

  /** Luồng nhiều câu (2–3 bước) — gửi khi hoàn thành wizard */
  @ApiPropertyOptional({
    type: [QuizAnswerDto],
    description: 'Trả lời từng câu hỏi — ưu tiên dùng field này',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers?: QuizAnswerDto[];

  /** @deprecated Một câu — giữ tương thích */
  @ApiPropertyOptional({ example: 'wifi-usage' })
  @ValidateIf((o) => !o.answers?.length)
  @IsOptional()
  @IsString()
  questionCode?: string;

  /** @deprecated Một câu — giữ tương thích */
  @ApiPropertyOptional({ type: [String], example: ['study'] })
  @ValidateIf((o) => !o.answers?.length)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionCodes?: string[];
}
