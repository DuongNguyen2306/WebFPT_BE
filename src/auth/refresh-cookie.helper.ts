import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { REFRESH_TOKEN_COOKIE } from './jwt.constants';

export function parseDurationToMs(raw: string, fallback: number): number {
  const m = /^(\d+)([dhm])$/i.exec(raw.trim());
  if (!m) return fallback;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  if (u === 'd') return n * 24 * 60 * 60 * 1000;
  if (u === 'h') return n * 60 * 60 * 1000;
  if (u === 'm') return n * 60 * 1000;
  return fallback;
}

export function setRefreshTokenCookie(res: Response, config: ConfigService, refreshToken: string) {
  const maxAgeMs = parseDurationToMs(
    config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d',
    7 * 24 * 60 * 60 * 1000,
  );
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: config.get<string>('NODE_ENV') === 'production',
    sameSite: 'lax',
    path: '/api/v1',
    maxAge: maxAgeMs,
  });
}

export function clearRefreshTokenCookie(res: Response, config: ConfigService) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: config.get<string>('NODE_ENV') === 'production',
    sameSite: 'lax',
    path: '/api/v1',
  });
}
