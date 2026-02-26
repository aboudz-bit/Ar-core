import { Injectable } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimiterService {
  private store = new Map<string, RateLimitEntry>();

  async isAllowed(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (entry.count >= limit) {
      return false;
    }

    entry.count++;
    return true;
  }

  async getRemainingAttempts(key: string, limit: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetAt) return limit;
    return Math.max(0, limit - entry.count);
  }
}
