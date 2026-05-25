import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow, IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultAddress?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Gửi null hoặc chuỗi rỗng để xóa email',
  })
  @Allow()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsEmail()
  email?: string | null;
}
