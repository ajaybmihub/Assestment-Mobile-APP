import { Controller, Get, Post } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Controller('monitor')
export class MonitorController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('health')
  checkHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('health-summary')
  async getHealthSummary() {
    return this.maintenanceService.getHealthSummary();
  }

  @Post('migrate-ids')
  async runMigration() {
    return this.maintenanceService.runMigration();
  }

  @Post('fix-orphans')
  async fixOrphans() {
    return this.maintenanceService.autoCreateMissingUsers();
  }

  @Post('link-jobs')
  async linkJobs() {
    return this.maintenanceService.linkInterviewsToJobs();
  }

  @Post('clean-questions')
  async cleanQuestions() {
    return this.maintenanceService.cleanOrphanedQuestions();
  }
}
