import { ApiProperty } from '@nestjs/swagger';

import { IsString, Matches, MinLength } from 'class-validator';



export class LoginDto {

  @ApiProperty({ example: 'duong79' })

  @IsString()

  @Matches(/^[a-zA-Z0-9_]{3,32}$/, {

    message: 'Tên đăng nhập: 3–32 ký tự, chỉ chữ, số và dấu _',

  })

  username!: string;



  @ApiProperty()

  @IsString()

  @MinLength(1)

  password!: string;

}

