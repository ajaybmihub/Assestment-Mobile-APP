import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/keep-alive')
  keepAlive() {
    return {
      status: 'active',
      timestamp: new Date().toISOString(),
      message: 'Backend is awake',
    };
  }

  @Get('api/cron-job')
  cronJob(@Query('key') key: string) {
    if (key !== 'super_secret_123') {
      throw new UnauthorizedException('Invalid cron key');
    }
    return {
      success: true,
      timestamp: new Date().toISOString(),
      action: 'ping_received',
    };
  }
}
