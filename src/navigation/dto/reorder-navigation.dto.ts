import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsMongoId } from 'class-validator';

export class ReorderNavigationDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách id nhóm menu theo thứ tự cột trái → phải',
    example: ['674a...', '674b...'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  ids!: string[];
}
