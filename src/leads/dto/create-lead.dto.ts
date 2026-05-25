import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: '0912345678' })
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  installAddress!: string;

  @ApiPropertyOptional({ description: 'Nếu có, phải là gói đang active để snapshot' })
  @IsOptional()
  @IsMongoId()
  packageId?: string;
}
