import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UnifiedLoginDto } from './dto/unified-login.dto';
import { REFRESH_TOKEN_COOKIE } from './jwt.constants';
import { ConfigService } from '@nestjs/config';
import { clearRefreshTokenCookie, setRefreshTokenCookie } from './refresh-cookie.helper';
import { JwtAccessAuthGuard } from '../guards/jwt-access.guard';
import { RequestUser } from './jwt.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký khách hàng (CUSTOMER)' })
  @ApiResponse({ status: 201 })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, role, user } = await this.auth.register(
      dto.username,
      dto.password,
      dto.fullName,
      dto.email,
    );
    setRefreshTokenCookie(res, this.config, refreshToken);
    return { accessToken, role, user };
  }

  @Post('login-unified')
  @ApiOperation({
    summary: 'Đăng nhập chung (admin hoặc khách)',
    description:
      'Body: account + password. BE thử admin (email) rồi khách (username). Trả role để FE redirect.',
  })
  async loginUnified(@Body() dto: UnifiedLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.loginUnified(dto.account, dto.password);
    setRefreshTokenCookie(res, this.config, result.refreshToken);
    const { refreshToken: _r, ...body } = result;
    return body;
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập khách (username + password)' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, role, user } = await this.auth.loginCustomer(
      dto.username,
      dto.password,
    );
    setRefreshTokenCookie(res, this.config, refreshToken);
    return { accessToken, role, user };
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Lấy access token mới',
    description: 'Đọc refresh token từ cookie HttpOnly `refreshToken`.',
  })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    const result = await this.auth.refresh(token);
    return result;
  }

  @Get('session')
  @UseGuards(JwtAccessAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Phiên đăng nhập hiện tại (CUSTOMER hoặc ADMIN)',
    description: 'Dùng access token. Trả role + profile tương ứng.',
  })
  async session(@Req() req: { user: RequestUser }) {
    return this.auth.getSessionFromAccess(req.user);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Xóa refresh cookie' })
  logout(@Res({ passthrough: true }) res: Response) {
    clearRefreshTokenCookie(res, this.config);
    return { ok: true };
  }
}
