import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { QuizTypeWeightDto } from './quiz-type-weight.dto';

export class QuizOptionDto {
  @ApiProperty({ example: 'study' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Học tập / Làm việc' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiPropertyOptional({ example: 'laptop' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({
    type: [QuizTypeWeightDto],
    description: 'Trọng số gợi ý loại gói (INTERNET, SPEEDX, …)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizTypeWeightDto)
  typeWeights!: QuizTypeWeightDto[];
}
