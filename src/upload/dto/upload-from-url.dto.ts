import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UploadFromUrlDto {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url!: string;

  @ApiPropertyOptional({
    description: 'Thư mục con trên Cloudinary (mặc định từ env CLOUDINARY_FOLDER)',
    example: 'packages/heroes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  folder?: string;
}
