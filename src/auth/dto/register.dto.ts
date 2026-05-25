import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';



export class RegisterDto {

  @ApiProperty({ example: 'duong79', description: 'Tên đăng nhập (username)' })

  @IsString()

  @Matches(/^[a-zA-Z0-9_]{3,32}$/, {

    message: 'Tên đăng nhập: 3–32 ký tự, chỉ chữ, số và dấu _',

  })

  username!: string;



  @ApiProperty({ minLength: 8, example: 'SecretPass1' })

  @IsString()

  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })

  password!: string;



  @ApiProperty({ example: 'Nguyễn Văn A' })

  @IsString()

  @MinLength(1)

  fullName!: string;



  @ApiPropertyOptional()

  @IsOptional()

  @IsEmail()

  email?: string;

}

