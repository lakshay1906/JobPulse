import { Body, Headers, Controller, Post, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { userRegisterDTO } from './dto/userRegister.dto';
import { LoginDTO } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(@Body() registerUserDto: userRegisterDTO) {
    return this.authService.registerUser(registerUserDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDTO) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  refresh(@Headers('authorization') authorization: string) {
    const token = this.authService.extractToken(authorization);
    return this.authService.refresh(token);
  }

  // Takes the refresh token from the header and revokes it
  @Get('logout')
  logout(@Headers('authorization') authorization: string) {
    const token = this.authService.extractToken(authorization);
    return this.authService.logout(token);
  }

  // Future feature: Logout from all devices
  @Get('logout-all-devices')
  logoutAllDevices(@Headers('authorization') authorization: string) {
    const token = this.authService.extractToken(authorization);
    return this.authService.logoutAllDevices(token);
  }
}
