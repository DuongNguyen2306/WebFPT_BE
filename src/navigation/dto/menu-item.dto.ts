import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class MenuItemDto {
  @ApiProperty({ example: 'Internet Wi-Fi 7' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: '/#internet', description: 'URL hoặc hash anchor (/#internet, /goi/...)' })
  @IsString()
  @IsNotEmpty()
  link!: string;

  @ApiPropertyOptional({ example: 'internet-giga', description: 'Mã gói — FE ưu tiên link /goi/:code' })
  @IsOptional()
  @IsString()
  packageCode?: string;

  @ApiPropertyOptional({ default: 0, description: 'Thứ tự item trong cột' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ default: false, description: 'Hiển thị tag "Mới" màu đỏ' })
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
