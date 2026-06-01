import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PackageType } from '../../common/enums';

export class QuizTypeWeightDto {
  @ApiProperty({ enum: PackageType, example: PackageType.INTERNET })
  @IsEnum(PackageType)
  packageType!: PackageType;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}
