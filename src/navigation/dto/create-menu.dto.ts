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
import { MenuItemDto } from './menu-item.dto';

export class CreateMenuDto {
  @ApiProperty({ example: 'Internet - Wifi' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    example: 'wifi',
    description: 'Mã icon: wifi | play-circle | cctv | home-wifi | shield | plus-circle',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ default: 0, description: 'Thứ tự cột từ trái sang phải' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ type: [MenuItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  items?: MenuItemDto[];
}
