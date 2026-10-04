import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
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
    if (!rawToken) throw new BadRequestException('token not provided');
    const [type, token] = rawToken?.split(' ') ?? [];
    const finalToken = type === 'Bearer' ? token : undefined;
    if (!finalToken) throw new BadRequestException('token not provided');
    // here
    try {
      // 💡 Here the JWT secret key that's used for verifying the payload
      // is the key that was passed in the JwtModule
      const payload = await this.jwtService.verifyAsync(finalToken);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid request');
    }
    return true;
  }
}
