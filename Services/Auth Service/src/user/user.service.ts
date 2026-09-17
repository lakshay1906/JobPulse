import { userRegisterDTO } from '#src/auth/dto/userRegister.dto';
import { PrismaService } from '#src/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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
      return createdUser;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        {
          status: 'error',
          message:
            'Something went wrong in Auth Service - User Creation Failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserDetails(at: string) {
    try {
      // Validate Access Token, if not expired then check of the user, if user exists then return the same.
      const { sub } = await this.jwt.verifyAsync(at, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      const user = await this.prisma.user.findFirst({
        where: {
          id: sub,
        },
      });
      return {
        status: 'success',
        data: {
          user,
        },
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        {
          message: 'Something went wrong!',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
