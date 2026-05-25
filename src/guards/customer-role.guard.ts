import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppRole, JwtSubjectKind } from '../common/enums';
import { RequestUser } from '../auth/jwt.types';

@Injectable()
export class CustomerRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const u = context.switchToHttp().getRequest<{ user?: RequestUser }>().user;
    return !!u && u.kind === JwtSubjectKind.CUSTOMER && u.role === AppRole.CUSTOMER;
  }
}
