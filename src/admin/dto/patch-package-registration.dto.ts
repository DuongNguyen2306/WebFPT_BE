import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LeadStatus } from '../../common/enums';

/** Admin cập nhật đơn đăng ký sau tư vấn / chốt gói khác */
export class PatchPackageRegistrationDto {
  @ApiPropertyOptional({
    description: 'Gói quan tâm mới sau khi tư vấn (cập nhật tên trong snapshot)',
    example: 'Combo Internet - Truyền hình FPT Play',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  packageName?: string;

  @ApiPropertyOptional({
    enum: LeadStatus,
    description: 'NEW=Mới | CONTACTED=Đang tư vấn | CONVERTED=Đã chốt | INSTALLED=Đã lắp đặt | CANCELLED=Hủy',
  })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ description: 'Ghi chú tư vấn của admin' })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ lắp đặt mới nếu khách đổi' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  address?: string;
}
