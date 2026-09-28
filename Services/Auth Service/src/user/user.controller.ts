import {
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '#src/auth/auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async getUser(
    @Req()
    request: {
      user: { sub: string; email: string; iat: number; exp: number };
    },
  ) {
    return await this.userService.getUserDetails(request.user);
  }
}
