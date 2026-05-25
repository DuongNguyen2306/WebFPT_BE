import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class LeadRateLimitService {
  private readonly hits = new Map<string, number[]>();

  checkIp(ip: string) {
    this.check(`ip:${ip || 'unknown'}`, 5, 15 * 60 * 1000);
  }

  checkPhone(phone: string) {
    this.check(`phone:${phone}`, 3, 60 * 60 * 1000);
  }

  private check(key: string, max: number, windowMs: number) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const arr = (this.hits.get(key) ?? []).filter((t) => t > windowStart);
    if (arr.length >= max) {
      throw new HttpException(
        'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    arr.push(now);
    this.hits.set(key, arr);
  }
}
