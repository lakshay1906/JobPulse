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
  private downUntil = 0;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      connectTimeout: 300,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });
  }

  async onModuleInit() {
    await this.redisClient.connect().catch((err) => {
      this.logger.error('Redis connect failed (will fail open on reads)', err);
      this.markDown();
    });
  }

  // Expose the raw ioredis client instance
  getClient(): Redis {
    return this.redisClient;
  }

  private isDown() {
    return Date.now() < this.downUntil;
  }
  private markDown() {
    this.downUntil = Date.now() + 5_000; // skip Redis for 5s
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      if (this.isDown() || !this.redisClient) return null;
      const raw = await this.redisClient.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      this.markDown();
      return null; // fail open
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds = 3600) {
    try {
      if (this.isDown() || !this.redisClient) return;
      await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      this.markDown();
    }
  }

  async del(...keys: string[]) {
    try {
      if (this.isDown() || !this.redisClient) return;
      if (keys.length) await this.redisClient.del(...keys);
    } catch {
      this.markDown();
    }
  }

  // Gracefully close the connection when the application shuts down
  async onModuleDestroy() {
    try {
      this.logger.log('Closing Redis connection...');
      if (this.isDown() || !this.redisClient) return;
      await this.redisClient.quit();
    } catch {
      // ignore
    }
  }
}
