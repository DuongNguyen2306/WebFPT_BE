import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { CustomersService } from '../customers/customers.service';
import { AdminsService } from '../admins/admins.service';
import { AppRole, JwtSubjectKind, CustomerStatus } from '../common/enums';
import { AccessJwtPayload, RefreshJwtPayload } from './jwt.types';
import { normalizeUsername } from '../common/utils/username.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly customers: CustomersService,
    private readonly admins: AdminsService,
  ) {}

  async register(usernameRaw: string, password: string, fullName: string, email?: string) {
    const username = normalizeUsername(usernameRaw);
    if (!username) {
      throw new BadRequestException('Tên đăng nhập không hợp lệ');
    }
    const exists = await this.customers.findByUsername(username);
    if (exists) {
      throw new ConflictException('Tên đăng nhập đã được sử dụng');
    }
    if (await this.admins.findByEmail(username)) {
      throw new ConflictException(
        'Tên đăng nhập này dành cho quản trị — đăng nhập tại /login, không đăng ký khách',
      );
    }
    const passwordHash = await argon2.hash(password);
    const customer = await this.customers.create({
      username,
      passwordHash,
      fullName,
      email: email?.trim() || undefined,
    });
    const tokens = await this.signCustomerTokens(customer._id.toString());
    const user = this.sanitizeCustomer(customer);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: AppRole.CUSTOMER,
      kind: JwtSubjectKind.CUSTOMER,
      user,
    };
  }

  async loginCustomer(usernameRaw: string, password: string) {
    const username = normalizeUsername(usernameRaw);
    if (!username) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }
    const customer = await this.customers.findByUsernameWithSecret(username);
    if (!customer || customer.status === CustomerStatus.LOCKED) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }
    const ok = await argon2.verify(customer.passwordHash, password);
    if (!ok) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }
    const tokens = await this.signCustomerTokens(customer._id.toString());
    const user = this.sanitizeCustomer(customer);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: AppRole.CUSTOMER,
      kind: JwtSubjectKind.CUSTOMER,
      user,
    };
  }

  /**
   * Một form đăng nhập: thử admin (email/login) trước, sau đó khách (username).
   */
  async loginUnified(accountRaw: string, password: string) {
    const account = accountRaw.trim();
    if (!account || !password) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const admin = await this.admins.findByEmailWithSecret(account.toLowerCase());
    if (admin) {
      const ok = await argon2.verify(admin.passwordHash, password);
      if (ok) {
        return this.loginAdmin(account, password);
      }
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    const username = normalizeUsername(account);
    if (username && (await this.admins.findByEmail(username))) {
      throw new UnauthorizedException(
        'Đây là tài khoản quản trị — chỉ đăng nhập trong collection admins (không dùng customers)',
      );
    }
    if (username) {
      const customer = await this.customers.findByUsernameWithSecret(username);
      if (customer && customer.status !== CustomerStatus.LOCKED) {
        const ok = await argon2.verify(customer.passwordHash, password);
        if (ok) {
          return this.loginCustomer(account, password);
        }
      }
    }

    throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
  }

  async loginAdmin(email: string, password: string) {
    const admin = await this.admins.findByEmailWithSecret(email.trim().toLowerCase());
    if (!admin) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }
    const ok = await argon2.verify(admin.passwordHash, password);
    if (!ok) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }
    const tokens = await this.signAdminTokens(admin._id.toString());
    const loginId =
      admin.email ?? (admin as { username?: string }).username ?? email.trim().toLowerCase();
    const profile = {
      id: admin._id.toString(),
      email: loginId,
      role: AppRole.ADMIN,
    };

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: AppRole.ADMIN,
      kind: JwtSubjectKind.ADMIN,
      admin: profile,
    };
  }

  async getSessionFromAccess(user: { sub: string; kind: JwtSubjectKind; role: AppRole }) {
    if (user.kind === JwtSubjectKind.ADMIN) {
      const admin = await this.admins.findById(user.sub);
      if (!admin) throw new UnauthorizedException();
      return {
        role: AppRole.ADMIN,
        kind: JwtSubjectKind.ADMIN,
        profile: { id: admin._id.toString(), email: admin.email, role: AppRole.ADMIN },
      };
    }
    const customer = await this.customers.findById(user.sub);
    if (!customer || customer.status === CustomerStatus.LOCKED) {
      throw new UnauthorizedException();
    }
    return {
      role: AppRole.CUSTOMER,
      kind: JwtSubjectKind.CUSTOMER,
      profile: this.sanitizeCustomer(customer),
    };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Thiếu refresh token');
    }
    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshJwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    if (payload.typ !== 'refresh' || !payload.sub || !payload.kind) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    if (payload.kind === JwtSubjectKind.CUSTOMER) {
      const c = await this.customers.findById(payload.sub);
      if (!c || c.status === CustomerStatus.LOCKED) {
        throw new ForbiddenException('Tài khoản không khả dụng');
      }
      const accessToken = await this.signAccessToken(payload.sub, JwtSubjectKind.CUSTOMER, AppRole.CUSTOMER);
      return { accessToken, role: AppRole.CUSTOMER, kind: JwtSubjectKind.CUSTOMER };
    }
    const a = await this.admins.findById(payload.sub);
    if (!a) {
      throw new ForbiddenException('Tài khoản không khả dụng');
    }
    const accessToken = await this.signAccessToken(payload.sub, JwtSubjectKind.ADMIN, AppRole.ADMIN);
    return { accessToken, role: AppRole.ADMIN, kind: JwtSubjectKind.ADMIN };
  }

  private async signCustomerTokens(customerId: string) {
    const accessToken = await this.signAccessToken(customerId, JwtSubjectKind.CUSTOMER, AppRole.CUSTOMER);
    const refreshToken = await this.signRefreshToken(customerId, JwtSubjectKind.CUSTOMER);
    return { accessToken, refreshToken };
  }

  private async signAdminTokens(adminId: string) {
    const accessToken = await this.signAccessToken(adminId, JwtSubjectKind.ADMIN, AppRole.ADMIN);
    const refreshToken = await this.signRefreshToken(adminId, JwtSubjectKind.ADMIN);
    return { accessToken, refreshToken };
  }

  private signAccessToken(sub: string, kind: JwtSubjectKind, role: AppRole) {
    const payload: AccessJwtPayload = { sub, kind, role };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m',
    });
  }

  private signRefreshToken(sub: string, kind: JwtSubjectKind) {
    const payload: RefreshJwtPayload = { sub, kind, typ: 'refresh' };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d',
    });
  }

  private sanitizeCustomer(doc: {
    _id: unknown;
    username: string;
    fullName: string;
    email?: string;
    defaultAddress?: string;
    status: string;
    role?: AppRole;
  }) {
    return {
      id: String(doc._id),
      username: doc.username,
      fullName: doc.fullName,
      email: doc.email ?? null,
      defaultAddress: doc.defaultAddress ?? null,
      role: AppRole.CUSTOMER,
      status: doc.status,
    };
  }
}
