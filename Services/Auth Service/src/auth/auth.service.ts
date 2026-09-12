import { UserService } from '#src/user/user.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { userRegisterDTO } from './dto/userRegister.dto';
import { PrismaService } from '#src/prisma/prisma.service';
import bcrypt from 'bcrypt';
import { LoginDTO } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}
  async registerUser(registerUserDTO: userRegisterDTO) {
    // Request validation
    const { name, email, password } = registerUserDTO;
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    )
      return { status: 'error', message: 'Invalid data' };
    const finalEmail = email.trim().toLowerCase();
    // Email uniqueness
    const existingUserCheck = await this.prisma.user.findUnique({
      where: {
        email: finalEmail,
      },
    });
    if (existingUserCheck)
      throw new HttpException(
        {
          status: 'error',
          message: 'User with this email already exists',
        },
        HttpStatus.CONFLICT,
      );
    // Password hashing
    const hashedPassword: string = await bcrypt.hash(password, 10);

    return this.userService.createUser({
      name,
      email: finalEmail,
      password: hashedPassword,
    });
  }

  async login(loginDto: LoginDTO) {
    try {
      const { email, password } = loginDto;
      if (typeof email !== 'string' || typeof password !== 'string')
        return { status: 'error', message: 'Invalid data' };
      const finalEmail = email.trim().toLowerCase();
      const findEmail = await this.prisma.user.findUnique({
        where: {
          email: finalEmail,
        },
      });
      if (!findEmail)
        throw new HttpException(
          { status: 'error', message: 'Invalid email or password' },
          HttpStatus.UNAUTHORIZED,
        );
      const isPasswordValid = await bcrypt.compare(
        password,
        findEmail.passwordHash,
      );
      if (!isPasswordValid)
        throw new HttpException(
          { status: 'error', message: 'Invalid email or password' },
          HttpStatus.UNAUTHORIZED,
        );
      const accessToken = await this.jwt.signAsync(
        {
          sub: findEmail.id,
          email: findEmail.email,
        },
        {
          secret: process.env.ACCESS_TOKEN_SECRET,
          expiresIn: '15m',
        },
      );
      const tokenId = crypto.randomUUID();
      const refreshToken = await this.jwt.signAsync(
        {
          sub: findEmail.id,
          tokenId,
        },
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
          id: tokenId,
          expiresAt,
          tokenHash,
          userId: findEmail.id,
        },
      });
      throw new HttpException(
        {
          status: 'success',
          message: 'Login Successfull',
          token: {
            accessToken,
            refreshToken,
          },
        },
        HttpStatus.OK,
      );
    } catch (error) {
      console.log(error);
      throw new HttpException(
        {
          status: 'error',
          message: 'Something went wrong in auth-service, while login',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
