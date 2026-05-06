import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { InterviewsService } from '../interviews/interviews.service';
import { UsersService } from '../users/users.service';
import { AiService } from '../ai/ai.service';
import FormData from 'form-data';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly interviewsService: InterviewsService,
    private readonly usersService: UsersService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
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

    // Ensure feedback fields are explicitly preserved in the payload
    if (payload.feedback === undefined) payload.feedback = "";
    if (payload.detailed_feedback === undefined) payload.detailed_feedback = "[]";

    this.logger.log(`Upserting session ${payload._id} with feedback length: ${payload.feedback?.length || 0}`);
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

  async checkIdentity(email: string, mobile: string) {
    const exists = await this.usersService.checkIdentity(email, mobile);
    return { exists };
  }

  async extractResume(file: Express.Multer.File) {
    const resumeServiceUrl = this.configService.get<string>('RESUME_SERVICE_URL') || 'http://localhost:8000';
    this.logger.log(`Forwarding resume to Python service: ${resumeServiceUrl}/extract`);

    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${resumeServiceUrl}/extract`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        }),
      );

      this.logger.log(`Extraction successful for: ${file.originalname}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Resume extraction failed: ${error.message}`);
      if (error.response) {
        this.logger.error(`Error response: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to extract resume text: ${error.message}`);
    }
  }

  async extractResumeAndSummarize(file: Express.Multer.File, userId: string) {
    this.logger.log(`Extracting and summarizing resume for user: ${userId}`);
    
    // 1. Extract Text from Python Microservice
    const extractionResult = await this.extractResume(file);
    if (!extractionResult.success) {
      return extractionResult;
    }

    const resumeText = extractionResult.text;

    // 2. Generate AI Summary immediately
    this.logger.log(`AI: Generating summary for extracted text (${resumeText.length} chars)`);
    let summary = '';
    try {
      summary = await this.aiService.summarizeResume(resumeText);
    } catch (e) {
      this.logger.error(`AI Summary generation failed: ${e.message}`);
      summary = 'Summary generation failed, but text was extracted.';
    }

    // 3. Update User Profile in DB
    await this.usersService.upsertUser({
      _id: userId,
      resume_text: resumeText,
      resume_summary: summary,
    });

    return {
      success: true,
      text: resumeText,
      summary: summary,
      metadata: extractionResult.metadata,
    };
  }
}
