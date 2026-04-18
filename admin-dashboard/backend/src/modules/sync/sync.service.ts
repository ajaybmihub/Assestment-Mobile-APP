import { Injectable, Logger } from '@nestjs/common';
import { InterviewsService } from '../interviews/interviews.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly interviewsService: InterviewsService,
    private readonly usersService: UsersService,
  ) {}

  async processInterviewSync(payload: any) {
    this.logger.log(`Processing interview sync for session: ${payload._id}`);
    return this.interviewsService.upsertInterview(payload);
  }

  async processUserSync(payload: any) {
    this.logger.log(`Processing user sync for profile: ${payload._id}`);
    return this.usersService.upsertUser(payload);
  }

  async processVideoSync(payload: any) {
    this.logger.log(`Processing video metadata for session: ${payload.sessionId}`);
    // Update interview record with video URL (mock)
    return { success: true, url: `https://storage.cloud/videos/${payload.sessionId}.mp4` };
  }

  async processLogSync(payload: any) {
    this.logger.log(`Processing diagnostic logs from device: ${payload.deviceId}`);
    return { success: true, count: payload.logs?.length || 0 };
  }
}
