import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Replace this
    const rawToken = request.headers.authorization;
    // From this
    if (!rawToken)
      throw new HttpException(
        {
          status: 'error',
          message: 'token not provided',
        },
        HttpStatus.BAD_REQUEST,
      );
    const [type, token] = rawToken?.split(' ') ?? [];
    const finalToken = type === 'Bearer' ? token : undefined;
    if (!finalToken)
      throw new HttpException(
        {
          status: 'error',
          message: 'token not provided',
        },
        HttpStatus.BAD_REQUEST,
      );
    // here
    try {
      // 💡 Here the JWT secret key that's used for verifying the payload
      // is the key that was passed in the JwtModule
      const payload = await this.jwtService.verifyAsync(finalToken, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
    return true;
  }
}
