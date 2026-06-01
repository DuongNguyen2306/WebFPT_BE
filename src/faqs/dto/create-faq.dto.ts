import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ example: 'Làm sao để đăng ký gói Internet?' })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiProperty({
    example: 'Bạn chọn gói trên trang chủ, điền form đăng ký.\nChúng tôi sẽ liên hệ trong 24h.',
    description: 'Nội dung trả lời, hỗ trợ xuống dòng (\\n)',
  })
  @IsString()
  @IsNotEmpty()
  answer!: string;

  @ApiPropertyOptional({ default: 0, description: 'Số nhỏ hiển thị trước' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
