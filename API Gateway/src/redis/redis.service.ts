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
  private readonly redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  async onModuleInit() {
    await this.redisClient.connect().catch((err) => {
      this.logger.error(
        'Redis connect failed (rate limit will fail open)',
        err,
      );
    });
  }

  /** Fixed-window counter. Returns new count, or null if Redis is down. */
  async incrWithExpire(
    key: string,
    windowSeconds: number,
  ): Promise<number | null> {
    try {
      const count = await this.redisClient.incr(key);
      if (count === 1) {
        await this.redisClient.expire(key, windowSeconds);
      }
      return count;
    } catch {
      return null; // fail open
    }
  }

  async getTtl(key: string): Promise<number> {
    try {
      return await this.redisClient.ttl(key);
    } catch {
      return -1;
    }
  }

  async onModuleDestroy() {
    try {
      await this.redisClient.quit();
    } catch {
      // ignore
    }
  }
}
