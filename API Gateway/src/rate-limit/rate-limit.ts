import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

function clientIp(req: Request): string {
  // behind proxy you may use x-forwarded-for later
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function ruleFor(
  method: string,
  path: string,
): { keyPrefix: string; limit: number; window: number } | null {
  if (path.startsWith('/health')) return null; // no limit

  if (method === 'POST' && path.startsWith('/auth/login')) {
    return { keyPrefix: 'rl:login:ip', limit: 5, window: 60 };
  }
  if (method === 'POST' && path.startsWith('/auth/register')) {
    return { keyPrefix: 'rl:register:ip', limit: 3, window: 60 };
  }
  if (method === 'POST' && path.startsWith('/auth/refresh')) {
    return { keyPrefix: 'rl:refresh:ip', limit: 20, window: 60 };
  }
  if (['POST', 'PATCH', 'DELETE'].includes(method)) {
    return { keyPrefix: 'rl:write:ip', limit: 60, window: 60 };
  }
  return { keyPrefix: 'rl:public:ip', limit: 100, window: 60 };
}

export function createRateLimitMiddleware(redis: RedisService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const rule = ruleFor(req.method, req.path);
    if (!rule) return next();

    const key = `${rule.keyPrefix}:${clientIp(req)}`;
    const count = await redis.incrWithExpire(key, rule.window);

    // Redis down → fail open
    if (count === null) return next();

    if (count > rule.limit) {
      const ttl = await redis.getTtl(key);
      res.setHeader('Retry-After', String(Math.max(ttl, 1)));
      return res.status(429).json({
        statusCode: 429,
        message: 'Too many requests. Try again later.',
      });
    }

    return next();
  };
}
