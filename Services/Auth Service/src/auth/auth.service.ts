import { UserService } from '#src/user/user.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { userRegisterDTO } from './dto/userRegister.dto';
import { PrismaService } from '#src/prisma/prisma.service';
import bcrypt from 'bcrypt';
import { LoginDTO } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { User } from '@prisma/client';

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
    const { passwordHash, ...user } = await this.userService.createUser({
      name,
      email: finalEmail,
      password: hashedPassword,
    });
    const tokens = await this.generateTokens({ passwordHash, ...user });
    return {
      status: 'Success',
      data: {
        user,
        tokens,
        message: 'User Created Successfully',
      },
    };
  }

  async login(loginDto: LoginDTO) {
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
    const { accessToken, refreshToken } = await this.generateTokens(findEmail);
    return {
      status: 'success',
      message: 'Login Successfull',
      token: {
        accessToken,
        refreshToken,
      },
    };
  }

  async generateTokens(user: User) {
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: '15m',
      },
    );
    const tokenId = crypto.randomUUID();
    const refreshToken = await this.jwt.signAsync(
      {
        sub: user.id,
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
        userId: user.id,
      },
    });
    return { accessToken, refreshToken };
  }

  async revokeRefreshToken(id: string, userId: string) {
    // 1. Check if the token is already revoked
    // const userId = '';
    const { count } = await this.prisma.refreshToken.updateMany({
      where: {
        id,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new UnauthorizedException('Invalid request');
  }

  async refresh(rt: string) {
    // 1. Parse the refresh token
    const data = await this.jwt.verifyAsync(rt, {
      secret: process.env.REFRESH_TOKEN_SECRET,
    });

    // 2. Revoke the old refresh token by tokenId from JWT
    await this.revokeRefreshToken(data.tokenId, data.sub);
    // 3. Generate & return new refresh and access token
    // 3a. Fetch User data buy 'sub' from JWT
    const user = await this.prisma.user.findFirst({
      where: {
        id: {
          equals: data.sub,
        },
      },
    });
    // 3b. Generate Tokens
    if (!user)
      throw new HttpException(
        { status: 'error', message: 'This user does exists' },
        HttpStatus.BAD_REQUEST,
      );
    const { accessToken, refreshToken } = await this.generateTokens(user);
    return {
      status: 'Success',
      message: 'Tokens generated successfully',
      token: {
        accessToken,
        refreshToken,
      },
    };
  }

  async logout(rt: string) {
    // 1. Parse the refresh token
    const data = await this.jwt.verifyAsync(rt, {
      secret: process.env.REFRESH_TOKEN_SECRET,
    });

    await this.revokeRefreshToken(data.tokenId, data.sub);
    return {
      status: 'Success',
      message: 'Logout successfully',
    };
  }

  async logoutAllDevices(rt: string) {
    const tokenData = await this.jwt.verifyAsync(rt, {
      secret: process.env.REFRESH_TOKEN_SECRET,
    });
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: tokenData.sub,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    return {
      status: 'Success',
      message: 'Successfully logged-out from all devices',
    };
  }

  extractToken(authorization: string) {
    if (!authorization)
      throw new HttpException(
        {
          status: 'error',
          message: 'token not provided',
        },
        HttpStatus.BAD_REQUEST,
      );
    const [type, token] = authorization?.split(' ') ?? [];
    const finalToken = type === 'Bearer' ? token : undefined;
    if (!finalToken)
      throw new HttpException(
        {
          status: 'error',
          message: 'token not provided',
        },
        HttpStatus.BAD_REQUEST,
      );
    return finalToken;
  }
}
