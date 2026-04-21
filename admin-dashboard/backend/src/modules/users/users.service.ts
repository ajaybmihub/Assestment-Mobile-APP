import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { AiService } from '../ai/ai.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private aiService: AiService,
  ) {}

  async generateAndStoreQuestions(deviceId: string): Promise<string[]> {
    this.logger.log(`Generating personalized questions for device: ${deviceId}`);
    const userId = `user_${deviceId}`;
    const user = await this.userModel.findOne({ _id: userId }).exec();

    if (!user) {
      this.logger.error(`User not found: ${userId}`);
      return [];
    }

    const { resume_text, name, preferences } = user;
    this.logger.log(`Found user: ${name}, Resume length: ${resume_text?.length || 0}`);
    const { target_role, preferred_job, experience_level } = preferences || {};

    if (!resume_text) {
      this.logger.warn(`No resume text found for user: ${userId}`);
      return [];
    }

    const questions = await this.aiService.generatePersonalizedQuestions(
      resume_text,
      target_role || 'General',
      preferred_job || 'General',
      experience_level || 'Fresher',
    );

    if (questions.length > 0) {
      await this.userModel.updateOne(
        { _id: userId },
        { $set: { personalized_questions: questions } },
      ).exec();
    }

    return questions;
  }

  async upsertUser(data: any): Promise<any> {
    this.logger.log(`Upserting user profile: ${data._id}`);
    const { _id, ...rest } = data;
    const update = { 
      ...rest,
      last_active_at: new Date(), // Always update last active
    };
    
    try {
      const result = await this.userModel.updateOne(
        { _id: _id },
        { $set: update },
        { upsert: true },
      ).exec();
      this.logger.log(`Upsert result for ${_id}: ${JSON.stringify(result)}`);
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
