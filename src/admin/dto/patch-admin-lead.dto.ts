import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LeadStatus } from '../../common/enums';

export class PatchAdminLeadDto {
  @ApiPropertyOptional({
    description: 'Gói quan tâm mới sau khi tư vấn',
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

  @ApiPropertyOptional({ description: 'Ghi chú tư vấn (alias adminNotes)' })
  @IsOptional()
  @IsString()
  adminNote?: string;

  @ApiPropertyOptional({ description: 'Ghi chú tư vấn' })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ lắp đặt mới' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  address?: string;
}
