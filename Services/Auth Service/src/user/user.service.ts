import { userRegisterDTO } from '#src/auth/dto/userRegister.dto';
import { PrismaService } from '#src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}
  async createUser({ name, email, password }: userRegisterDTO) {
    try {
      const createdUser = await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash: password,
        },
      });
      const accessTokenPayload = {
        sub: createdUser.id,
        email: createdUser.email,
      };
      const accessToken = await this.jwt.signAsync(accessTokenPayload, {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: '15m',
      });
      const refreshTokenId = crypto.randomUUID();
      const refreshToken = await this.jwt.signAsync(
        { sub: createdUser.id, tokenId: refreshTokenId },
        {
          secret: process.env.REFRESH_TOKEN_SECRET,
          expiresIn: '7d',
        },
      );

      const refreshDurationMs = ms('7d');
      const expiresAt = new Date(Date.now() + refreshDurationMs);

      const tokenHash = await bcrypt.hash(refreshToken, 10);

      await this.prisma.refreshToken.create({
        data: {
          id: refreshTokenId,
          userId: createdUser.id,
          expiresAt,
          tokenHash,
        },
      });
      const { passwordHash, ...user } = createdUser;
      return {
        status: 'success',
        data: {
          user,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        message: 'User Created successfull',
      };
    } catch (error) {
      console.log(error);
      return {
        status: 'error',
        message: 'Something went wrong in Auth Service - User Creation Failed',
      };
    }
  }
}
