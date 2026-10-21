import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisClient: Redis | null;
  private downUntil = 0;

  constructor() {
    try {
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        connectTimeout: 300,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        retryStrategy: (times) => Math.min(times * 200, 5000),
      });
    } catch {
      this.markDown();
      this.redisClient = null;
    }
  }

  async onModuleInit() {
    if (!this.redisClient) return;
    await this.redisClient.connect().catch((err) => {
      this.logger.error(
        'Redis connect failed (rate limit will fail open)',
        err,
      );
      this.markDown();
    });
  }

  private isDown() {
    return Date.now() < this.downUntil;
  }
  private markDown() {
    this.downUntil = Date.now() + 5_000; // skip Redis for 5s
  }

  /** Fixed-window counter. Returns new count, or null if Redis is down. */
  async incrWithExpire(
    key: string,
    windowSeconds: number,
  ): Promise<number | null> {
    try {
      if (this.isDown() || !this.redisClient) return null;
      const count = await this.redisClient.incr(key);
      if (count === 1) {
        await this.redisClient.expire(key, windowSeconds);
      }
      return count;
    } catch {
      this.markDown();
      return null; // fail open
    }
  }

  async getTtl(key: string): Promise<number> {
    try {
      if (this.isDown() || !this.redisClient) return -1;
      return await this.redisClient.ttl(key);
    } catch {
      this.markDown();
      return -1;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.isDown() || !this.redisClient) return;
      await this.redisClient.quit();
    } catch {
      this.markDown();
    }
  }
}
