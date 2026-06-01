import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LookupLeadsByPhoneQueryDto {
  @ApiProperty({ example: '0912345678', description: 'Số điện thoại đã dùng khi đăng ký' })
  @IsString()
  @MinLength(9)
  phone!: string;
}
