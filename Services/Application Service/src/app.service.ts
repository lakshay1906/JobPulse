import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  async getDashboardStats(userId: string) {
    const key = `app:dashboard:stats:user:${userId}`;
    const cached = await this.redis.getJson(key);
    if (cached) return cached;
    const [totalApplications, totalCompanies, totalJobs, applicationsByStatus] =
      await Promise.all([
        this.prisma.application.count({
          where: {
            userId,
          },
        }),
        this.prisma.company.count({
          where: {
            userId,
          },
        }),
        this.prisma.job.count({
          where: {
            company: {
              is: {
                userId,
              },
            },
          },
        }),
        this.prisma.application.groupBy({
          by: ['status'],
          where: { userId },
          _count: {
            _all: true,
          },
        }),
      ]);
    const payload = {
      status: 'success',
      data: {
        totalCompanies,
        totalJobs,
        totalApplications,
        applicationsByStatus,
      },
    };
    await this.redis.setJson(key, payload, 3600);
    return payload;
  }
}
