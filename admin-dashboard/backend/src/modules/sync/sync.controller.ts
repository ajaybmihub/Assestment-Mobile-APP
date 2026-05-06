import { Controller, Post, Get, Body, Query, Logger, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  @Get('check-identity')
  async checkIdentity(
    @Query('email') email: string,
    @Query('mobile') mobile: string,
  ) {
    this.logger.log(`Checking identity availability for: Email=${email}, Mobile=${mobile}`);
    return this.syncService.checkIdentity(email, mobile);
  }

  @Post('interview')
  async syncInterview(@Body() payload: any) {
    this.logger.log(`Received interview sync for session: ${payload._id}`);
    return this.syncService.processInterviewSync(payload);
  }

  @Post('video')
  async syncVideo(@Body() payload: any) {
    this.logger.log(`Received video sync for session: ${payload.sessionId}`);
    return this.syncService.processVideoSync(payload);
  }

  @Post('log')
  async syncLog(@Body() payload: any) {
    this.logger.log(`Received log sync from device: ${payload.deviceId}`);
    return this.syncService.processLogSync(payload);
  }

  @Post('user')
  async syncUser(@Body() payload: any) {
    this.logger.log(`Incoming user sync request for profile: ${payload._id} (Device: ${payload.device_name})`);
    return this.syncService.processUserSync(payload);
  }

  @Post('generate-questions')
  async generateQuestions(@Body() payload: { deviceId: string }) {
    this.logger.log(`Received question generation request for device: ${payload.deviceId}`);
    return this.syncService.triggerQuestionGeneration(payload.deviceId);
  }

  @Post('resume')
  @UseInterceptors(FileInterceptor('file'))
  async syncResume(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    this.logger.log(`Received resume upload for user ${userId}: ${file.originalname}`);
    return this.syncService.extractResumeAndSummarize(file, userId);
  }
}
