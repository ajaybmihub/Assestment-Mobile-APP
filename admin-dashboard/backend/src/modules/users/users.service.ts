import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { AiService } from '../ai/ai.service';
import { QuestionsService } from '../questions/questions.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private aiService: AiService,
    private questionsService: QuestionsService,
  ) {}

  async generateAndStoreQuestions(deviceId: string): Promise<string[]> {
    this.logger.log(`Generating personalized questions for device: ${deviceId}`);
    const userId = `user_${deviceId}`;
    const user = await this.userModel.findOne({ _id: userId }).exec();

    if (!user) {
      this.logger.error(`User not found: ${userId}`);
      return [];
    }

    const { resume_summary, name, preferences } = user;
    this.logger.log(`Found user: ${name}, Has Summary: ${!!resume_summary}`);
    const { target_role, preferred_job, experience_level } = preferences || {};

    if (!resume_summary) {
      this.logger.warn(`No resume summary found for user: ${userId}. Skipping question generation.`);
      return [];
    }

    const questions = await this.aiService.generatePersonalizedQuestions(
      resume_summary, 
      target_role || 'General',
      preferred_job || 'General',
      experience_level || 'Professional',
    );

    if (questions.length > 0) {
      this.logger.log(`AI: Successfully generated ${questions.length} questions. Saving to PersonalizedQuestion collection...`);
      // Store in dedicated PersonalizedQuestion collection
      // For now, using 0 as jobId if not explicitly a number
      await this.questionsService.savePersonalizedQuestions(
        userId,
        0, 
        questions,
        experience_level || 'Intermediate'
      );
      this.logger.log(`AI: Personalized questions successfully stored for user ${userId}.`);
    } else {
      this.logger.warn(`AI: No questions were generated for user ${userId}.`);
    }

    return questions;
  }

  async upsertUser(data: any): Promise<any> {
    this.logger.log(`Upserting user profile: ${data._id}`);
    const { _id, ...rest } = data;
    const update = { 
      ...rest,
      updated_at: new Date(),
    };
    
    this.logger.log(`AI DEBUG: Incoming keys for ${_id}: ${Object.keys(data).join(', ')}`);
    
    try {
      const existingUser = await this.userModel.findById(_id).exec();
      this.logger.log(`AI DEBUG: Existing user found? ${!!existingUser}. Has summary? ${!!existingUser?.resume_summary}`);
      
      // --- AI LOGIC: Auto-generate summary if resume text is provided but summary is missing ---
      if (update['resume_text'] && (!update['resume_summary'] || update['resume_text'] !== existingUser?.resume_text)) {
        this.logger.log(`AI: New resume text detected for ${_id}. Generating fresh summary...`);
        try {
          const summary = await this.aiService.summarizeResume(update['resume_text']);
          update['resume_summary'] = summary;
          this.logger.log(`AI: Successfully generated summary for ${_id}`);
        } catch (e) {
          this.logger.error(`AI Summary generation failed for ${_id}: ${e.message}`);
        }
      }

      const result = await this.userModel.findOneAndUpdate(
        { _id: _id },
        { $set: update },
        { upsert: true, new: true },
      ).exec();

      // Trigger question generation only if BOTH resume and job are chosen AND it's a new choice
      // Trigger question generation only if BOTH summary and job are available
      const currentSummary = update['resume_summary'] || existingUser?.resume_summary;
      const currentJob = rest.preferred_job || existingUser?.preferences?.preferred_job;

      if (currentSummary && currentJob) {
        const hasJobChanged = existingUser?.preferences?.preferred_job !== rest.preferred_job || 
                              existingUser?.preferences?.target_role !== rest.target_role;
        
        const hasSummaryJustGenerated = !!update['resume_summary'];

        if (hasJobChanged || hasSummaryJustGenerated) {
          this.logger.log(`AI: Summary and Job ready. Triggering question generation for ${_id}...`);
          const deviceId = _id.replace('user_', '');
          
          this.generateAndStoreQuestions(deviceId).catch(e => {
            this.logger.error(`AI Auto-Question failed for ${deviceId}: ${e.message}`);
          });
        }
      }

      this.logger.log(`Upsert finished for ${_id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upsert user ${_id}: ${error.message}`);
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<User[]> {
    return this.userModel
      .find()
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userModel.findOne({ _id: id }).exec();
  }

  async countAll(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }
}
