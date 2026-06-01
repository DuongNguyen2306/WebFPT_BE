import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class QuizAnswerDto {
  @ApiProperty({ example: 'wifi-usage' })
  @IsString()
  @IsNotEmpty()
  questionCode!: string;

  @ApiProperty({ type: [String], example: ['media', 'game'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  optionCodes!: string[];
}
