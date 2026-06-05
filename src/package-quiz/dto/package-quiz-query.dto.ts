import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PackageQuizQueryDto {
  @ApiPropertyOptional({
    example: 'home-needs',
    description: 'Mã bộ câu hỏi — mặc định quiz visible đầu tiên',
  })
  @IsOptional()
  @IsString()
  code?: string;
}
