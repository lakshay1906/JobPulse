import { userRegisterDTO } from '#src/auth/dto/userRegister.dto';
import { PrismaService } from '#src/prisma/prisma.service';
import { RedisService } from '#src/redis/redis.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}
  async createUser({ name, email, password }: userRegisterDTO) {
    const createdUser = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash: password,
      },
    });
    return createdUser;
  }

  async getUserDetails(tokenBody: {
    sub: string;
    email: string;
    iat: number;
    exp: number;
  }) {
    const key = `auth:user:one:${tokenBody.sub}`;

    const cached = await this.redis.getJson(key);
    if (cached) return cached;

    const user = await this.prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      where: {
        id: tokenBody.sub,
      },
    });

    await this.redis.setJson(
      key,
      {
        status: 'success',
        data: {
          user,
        },
      },
      3600,
    );

    return {
      status: 'success',
      data: {
        user,
      },
    };
  }
}
