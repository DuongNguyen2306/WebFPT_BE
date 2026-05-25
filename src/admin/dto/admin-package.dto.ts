import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { BillingCycle, PackageType } from '../../common/enums';

export class CreatePackageDto {
  @ApiProperty({ enum: PackageType })
  @IsEnum(PackageType)
  type!: PackageType;

  @ApiProperty({ example: 'internet-giga' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayCode?: string;

  @ApiPropertyOptional({ description: 'Alias FE: tagline' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promoBadge?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  price?: number | null;

  @ApiPropertyOptional({ description: 'Alias FE: monthlyPrice' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  monthlyPrice?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priceNote?: string;

  @ApiProperty({ enum: BillingCycle })
  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  speedLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specCaption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specLine?: string;

  @ApiPropertyOptional({ enum: ['gauge', 'tv', 'camera', 'sparkles'] })
  @IsOptional()
  @IsString()
  statIcon?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Alias: bullets, featureList' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bullets?: string[];

  @ApiPropertyOptional({ description: 'Ít nhất một trong imageUrl / heroImage' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Alias FE: heroImage' })
  @IsOptional()
  @IsString()
  heroImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accentImageUrl?: string;

  @ApiPropertyOptional({ description: 'Alias FE: accentImage, secondaryImage' })
  @IsOptional()
  @IsString()
  accentImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdatePackageDto extends PartialType(CreatePackageDto) {}
