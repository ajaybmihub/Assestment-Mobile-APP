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
    
    // Auto-map proctoring flags if they exist
    if (payload.proctoring_flags) {
      payload.proctoring = {
        no_face: payload.proctoring_flags.no_face ?? 0,
        multiple_faces: payload.proctoring_flags.multi_face ?? 0,
        head_rotation: payload.proctoring_flags.head_rotation ?? 0,
      };
      // Clean up the raw field to prevent schema pollution
      delete payload.proctoring_flags; 
    }

    return this.interviewsService.upsertInterview(payload);
  }

  async processUserSync(payload: any) {
    this.logger.log(`Processing user sync for profile: ${payload._id}`);
    return this.usersService.upsertUser(payload);
  }

  async processVideoSync(payload: any) {
    this.logger.log(`Processing video metadata for session: ${payload.sessionId}`);
    if (!payload.sessionId || !payload.videoUrl) {
      throw new Error('Missing sessionId or videoUrl');
    }
    return this.interviewsService.updateVideoUrl(payload.sessionId, payload.videoUrl);
  }

  async processLogSync(payload: any) {
    this.logger.log(`Processing diagnostic logs from device: ${payload.deviceId}`);
    return { success: true, count: payload.logs?.length || 0 };
  }

  async triggerQuestionGeneration(deviceId: string) {
    this.logger.log(`Triggering AI question generation for device: ${deviceId}`);
    const questions = await this.usersService.generateAndStoreQuestions(deviceId);
    return { success: true, questions };
  }
}
