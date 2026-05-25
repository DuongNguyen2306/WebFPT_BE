import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PackageType } from '../../common/enums';

export class PublicPackagesQueryDto {
  @ApiPropertyOptional({ enum: PackageType })
  @IsOptional()
  @IsEnum(PackageType)
  type?: PackageType;
}
