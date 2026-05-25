import { AppRole, JwtSubjectKind } from '../common/enums';

export interface AccessJwtPayload {
  sub: string;
  kind: JwtSubjectKind;
  role: AppRole;
}

export interface RefreshJwtPayload {
  sub: string;
  kind: JwtSubjectKind;
  typ: 'refresh';
}

export interface RequestUser {
  sub: string;
  kind: JwtSubjectKind;
  role: AppRole;
}
