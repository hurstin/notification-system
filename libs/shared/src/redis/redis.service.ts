import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * A shared wrapper service around the ioredis client.
 * Provides safe, type-cast, and standardized methods for interacting with Redis.
 * All methods implement fail-safe (try/catch) mechanisms so that if Redis is offline,
 * the application continues running gracefully rather than throwing 500 Server Errors.
 */
@Injectable()
export class RedisService {
  // NestJS logger initialized with the class name for easier debugging
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  /**
   * Stores a key-value pair in Redis.
   * Automatically serializes JavaScript objects/arrays into JSON strings.
   *
   * @param key The unique string identifier for the data.
   * @param value The arbitrary data (object, string, array, etc.) to store.
   * @param ttlSeconds Optional Time-To-Live in seconds. If provided, the key will auto-delete.
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      // Redis only stores strings, so we convert the JS object to a JSON string
      const stringValue = JSON.stringify(value);

      if (ttlSeconds) {
        // 'EX' tells Redis to set the expiration time in seconds
        await this.redisClient.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        // Store permanently without an expiration token
        await this.redisClient.set(key, stringValue);
      }
    } catch (error) {
      // Catch network or parsing errors to prevent aggressive crashing
      this.logger.error(`Failed to set key ${key} in Redis`, error);
    }
  }

  /**
   * Retrieves and automatically deserializes data from Redis.
   *
   * @param key The unique string identifier.
   * @returns The parsed object cast to generic type <T>, or null if not found/error.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);

      // If the key expired or was deleted, return null immediately
      if (!value) return null;

      // Parse the JSON string back into a heavily-typed JS object
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get key ${key} from Redis`, error);
      return null;
    }
  }

  /**
   * Atomically increments the number stored at `key` by one.
   * Extensively used for Rate Limiting to guarantee thread-safe counting.
   *
   * @param key The unique string identifier for the counter.
   * @returns The new incremented value, or null if the connection failed.
   */
  async incr(key: string): Promise<number | null> {
    try {
      // Automatically creates the key at "0" if it doesn't exist, then increments it to "1"
      return await this.redisClient.incr(key);
    } catch (error) {
      this.logger.error(`Failed to increment key ${key} in Redis`, error);
      return null;
    }
  }

  /**
   * Sets a timeout/Time-To-Live on an already existing key.
   * After the timeout expires, the key automatically self-destructs.
   *
   * @param key The unique string identifier.
   * @param ttlSeconds The lifespan of the key in seconds.
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.redisClient.expire(key, ttlSeconds);
    } catch (error) {
      this.logger.error(`Failed to expire key ${key} in Redis`, error);
    }
  }

  /**
   * Forcibly removes a key and its data from the Redis database.
   *
   * @param key The specific string identifier to delete.
   */
  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key} in Redis`, error);
    }
  }
}
