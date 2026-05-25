import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { setRefreshTokenCookie } from '../auth/refresh-cookie.helper';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { RequestUser } from '../auth/jwt.types';
import { AppRole } from '../common/enums';

@ApiTags('Admin — Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập quản trị (email + password)' })
  async login(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, role, admin } = await this.auth.loginAdmin(dto.email, dto.password);
    setRefreshTokenCookie(res, this.config, refreshToken);
    return { accessToken, role, admin };
  }

  @Get('me')
  @UseGuards(JwtAccessAuthGuard, AdminRoleGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Profile admin đang đăng nhập' })
  async me(@Req() req: { user: RequestUser }) {
    const session = await this.auth.getSessionFromAccess(req.user);
    return { ...session.profile, role: AppRole.ADMIN };
  }
}
