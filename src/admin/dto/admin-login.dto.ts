import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Email hoặc username admin (vd. admin1, admin@example.com)',
    example: 'admin1',
  })
  @IsString()
  @MinLength(1)
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string;
}
