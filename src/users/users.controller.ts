import { Body, Controller, Get, Patch, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { CustomerRoleGuard } from '../guards/customer-role.guard';
import { CurrentCustomerId } from '../common/decorators/current-customer-id.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.query.dto';
import {
  ApiErrorResponseDto,
  UserProfileResponseDto,
  UserRegistrationsListResponseDto,
} from '../swagger/swagger-responses.dto';

@ApiTags('Users — Profile & Registrations')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAccessAuthGuard, CustomerRoleGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Hồ sơ người dùng đang đăng nhập' })
  @ApiOkResponse({ type: UserProfileResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  getProfile(@CurrentCustomerId() customerId: string) {
    return this.users.getProfile(customerId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật hồ sơ (PATCH)' })
  @ApiOkResponse({ type: UserProfileResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  patchProfile(
    @CurrentCustomerId() customerId: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.users.updateProfile(customerId, dto);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật hồ sơ (PUT)' })
  @ApiOkResponse({ type: UserProfileResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  putProfile(
    @CurrentCustomerId() customerId: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.users.updateProfile(customerId, dto);
  }

  @Get('registrations')
  @ApiOperation({
    summary: 'Lịch sử đăng ký dịch vụ',
    description:
      'Đơn gắn customerId hoặc cùng SĐT profile — sắp xếp mới nhất trước.',
  })
  @ApiOkResponse({ type: UserRegistrationsListResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  getRegistrations(
    @CurrentCustomerId() customerId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.users.getRegistrations(customerId, query.page ?? 1, query.limit ?? 20);
  }
}
