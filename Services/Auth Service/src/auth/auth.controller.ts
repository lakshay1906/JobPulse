import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { userRegisterDTO } from './dto/userRegister.dto';
import { LoginDTO } from './dto/login.dto';
import { RefreshDTO } from './dto/refresh.dto';

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
  refresh(@Body() refreshDto: RefreshDTO) {
    return this.authService.refresh(refreshDto);
  }

  @Post('logout')
  logout(@Body() logoutDto: RefreshDTO) {
    return this.authService.logout(logoutDto);
  }
}
