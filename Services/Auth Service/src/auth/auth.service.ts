import { UserService } from '#src/user/user.service';
import { Injectable } from '@nestjs/common';
import { userRegisterDTO } from './dto/userRegister.dto';
import { PrismaService } from '#src/prisma/prisma.service';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
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
    const finalEmail = registerUserDTO.email.trim().toLowerCase();
    // Email uniqueness
    const existingUserCheck = await this.prisma.user.findUnique({
      where: {
        email: finalEmail,
      },
    });
    if (existingUserCheck) {
      return {
        status: 'error',
        message: 'User with this email already exists',
      };
    }
    // Password hashing
    const hashedPassword: string = await bcrypt.hash(password, 10);

    return this.userService.createUser({
      name,
      email: finalEmail,
      password: hashedPassword,
    });
  }
}
