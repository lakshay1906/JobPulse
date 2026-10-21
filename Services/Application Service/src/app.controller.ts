import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './auth.guard';
import { User } from './types/user';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(AuthGuard)
  @Get('applications/dashboard/stats')
  getDashboardStats(@Req() req: { user: User }) {
    return this.appService.getDashboardStats(req.user.sub);
  }
}
