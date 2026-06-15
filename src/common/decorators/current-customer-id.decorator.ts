import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtSubjectKind } from '../enums';
import { RequestUser } from '../../auth/jwt.types';

/** Lấy MongoDB customer id từ JWT (chỉ dùng sau CustomerRoleGuard). */
export const CurrentCustomerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const user = ctx.switchToHttp().getRequest<{ user?: RequestUser }>().user;
    if (!user || user.kind !== JwtSubjectKind.CUSTOMER) {
      throw new UnauthorizedException();
    }
    return user.sub;
  },
);
