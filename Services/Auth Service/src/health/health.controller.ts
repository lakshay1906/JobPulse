import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  healthCheck() {
    return {
      service: 'auth-service',
      status: 'ok',
    };
  }
}
