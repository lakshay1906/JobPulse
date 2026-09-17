import {
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('me')
  async getUser(@Headers('authorization') authorization: string) {
    try {
      if (!authorization)
        throw new HttpException(
          {
            status: 'error',
            message: 'token not provided',
          },
          HttpStatus.BAD_REQUEST,
        );
      return await this.userService.getUserDetails(authorization);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        {
          status: 'Error',
          message: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
