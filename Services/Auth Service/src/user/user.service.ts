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
    // Validate Access Token, if not expired then check of the user, if user exists then return the same.

    const user = await this.prisma.user.findFirst({
      where: {
        id: tokenBody.sub,
      },
    });
    return {
      status: 'success',
      data: {
        user,
      },
    };
  }
}
