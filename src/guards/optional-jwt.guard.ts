import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt-access') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      (req as { user?: undefined }).user = undefined;
      return true;
    }
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      (req as { user?: undefined }).user = undefined;
      return true;
    }
  }

  handleRequest<TUser>(
    err: Error | undefined,
    user: TUser | false,
    _info: unknown,
    _ctx: ExecutionContext,
    status?: unknown,
  ) {
    void _info;
    void _ctx;
    void status;
    if (err || !user) {
      return undefined as unknown as TUser;
    }
    return user;
  }
}
