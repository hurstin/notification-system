import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Checks if an action should be rate-limited.
   * If not limited, it increments the specific counter.
   *
   * @param key Base key for the limit (e.g., 'email', 'push')
   * @param identifier Unique identifier (e.g., userId, email address)
   * @param limit Maximum allowed actions in the timeframe
   * @param ttlSeconds Timeframe in seconds
   * @returns boolean - True if the action is ALLOWED, false if RATE LIMITED
   */
  async checkRateLimit(
    key: string,
    identifier: string,
    limit: number,
    ttlSeconds: number,
  ): Promise<boolean> {
    const redisKey = `rate_limit:${key}:${identifier}`;

    try {
      const currentCount = await this.redisService.incr(redisKey);

      if (currentCount === null) {
        // If Redis failed, fail open to avoid breaking functionality
        this.logger.warn(
          `Redis increment failed for ${redisKey}. Permitting action.`,
        );
        return true;
      }

      if (currentCount === 1) {
        // First request in the time window, set the expiration
        await this.redisService.expire(redisKey, ttlSeconds);
      }

      if (currentCount > limit) {
        this.logger.warn(
          `Rate limit exceeded for key: ${redisKey}. Limit: ${limit}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to check rate limit for ${redisKey}`, error);
      return true; // fail open
    }
  }
}
