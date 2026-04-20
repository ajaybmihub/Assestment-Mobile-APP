import { Controller, Get } from '@nestjs/common';

@Controller('monitor')
export class MonitorController {
  @Get('health')
  checkHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
