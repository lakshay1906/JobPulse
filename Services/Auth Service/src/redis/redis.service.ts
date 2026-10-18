// src/redis/redis.service.ts
import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  async onModuleInit() {
    await this.redisClient.connect().catch((err) => {
      this.logger.error('Redis connect failed (will fail open on reads)', err);
    });
  }

  // Expose the raw ioredis client instance
  getClient(): Redis {
    return this.redisClient;
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redisClient.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null; // fail open
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds = 3600) {
    try {
      await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // ignore
    }
  }

  async del(...keys: string[]) {
    try {
      if (keys.length) await this.redisClient.del(...keys);
    } catch {
      // ignore
    }
  }

  // Gracefully close the connection when the application shuts down
  async onModuleDestroy() {
    try {
      this.logger.log('Closing Redis connection...');
      await this.redisClient.quit();
    } catch (error) {
      console.log(error);
    }
  }
}
