import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UnifiedLoginDto {
  @ApiProperty({
    example: 'admin1',
    description: 'Admin: email đăng nhập. Khách: username.',
  })
  @IsString()
  @MinLength(1)
  account!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string;
}
