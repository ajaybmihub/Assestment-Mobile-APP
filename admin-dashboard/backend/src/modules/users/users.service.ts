import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { MobileDevice } from './mobile.schema';
import { AiService } from '../ai/ai.service';
import { QuestionsService } from '../questions/questions.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(MobileDevice.name) private mobileModel: Model<MobileDevice>,
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
    const { _id, email, mobile_number, preferences, ...rest } = data;
    this.logger.log(`Upserting user profile: ${_id} (Email: ${email}, Mobile: ${mobile_number})`);
    
    // Separate hardware/mobile data from user data
    const hardwareFields = [
      'device_name', 'app_version', 'cpu_cores', 'total_ram', 'processor', 
      'last_sync_at', 'device_id'
    ];
    
    const mobileData: any = {};
    const userData: any = { ...rest };
    
    // Move hardware fields to mobileData and remove from userData
    hardwareFields.forEach(field => {
      if (field in userData) {
        mobileData[field] = userData[field];
        delete userData[field];
      }
    });

    // Special case for device_id: it stays in both (mapping in user, primary key in mobile)
    if (mobileData.device_id) {
      userData.device_id = mobileData.device_id;
    }

    // Find if user exists with same email OR mobile number
    let existingUser: User | null = null;
    if (email || mobile_number) {
      const query: any[] = [];
      if (email) query.push({ email: email });
      if (mobile_number) query.push({ mobile_number: mobile_number });
      
      existingUser = await this.userModel.findOne({ $or: query }).exec();
    }

    if (!existingUser) {
      existingUser = await this.userModel.findById(_id).exec();
    }

    const targetId = existingUser ? existingUser._id : _id;
    
    const update: any = { 
      ...userData,
      email,
      mobile_number,
      updatedAt: new Date(),
    };

    // Ensure preferences are correctly merged/updated
    if (preferences) {
      update.preferences = {
        ...(existingUser?.preferences || {}),
        ...preferences
      };
    }
    
    try {
      // --- AI LOGIC: Auto-generate summary if resume text is provided but summary is missing ---
      if (update.resume_text && (!update.resume_summary || update.resume_text !== existingUser?.resume_text)) {
        this.logger.log(`AI: New resume text detected for ${targetId}. Generating fresh summary...`);
        try {
          const summary = await this.aiService.summarizeResume(update.resume_text);
          update.resume_summary = summary;
        } catch (e) {
          this.logger.error(`AI Summary generation failed for ${targetId}: ${e.message}`);
        }
      }

      const result = await this.userModel.findOneAndUpdate(
        { _id: targetId },
        { $set: update },
        { upsert: true, returnDocument: 'after' },
      ).exec();

      // Trigger question generation only if BOTH summary and job are available
      const currentSummary = update.resume_summary || existingUser?.resume_summary;
      const currentJob = update.preferences?.preferred_job || existingUser?.preferences?.preferred_job;

      if (currentSummary && currentJob) {
        const hasJobChanged = existingUser?.preferences?.preferred_job !== update.preferences?.preferred_job || 
                              existingUser?.preferences?.target_role !== update.preferences?.target_role;
        
        const hasSummaryJustGenerated = !!update.resume_summary;

        if (hasJobChanged || hasSummaryJustGenerated) {
          this.logger.log(`AI: Summary and Job ready. Triggering question generation for ${targetId}...`);
          const deviceId = targetId.replace('user_', '');
          this.generateAndStoreQuestions(deviceId).catch(e => {
            this.logger.error(`AI Auto-Question failed for ${deviceId}: ${e.message}`);
          });
        }
      }

      // --- Sync Mobile Technical Data (Separate Collection) ---
      if (mobileData.device_id) {
        await this.mobileModel.findOneAndUpdate(
          { device_id: mobileData.device_id },
          {
            $set: {
              ...mobileData,
              user_id: targetId,
              last_sync_at: mobileData.last_sync_at || new Date(),
            }
          },
          { upsert: true, returnDocument: 'after' }
        ).exec();
        this.logger.log(`Mobile technical data synced for device: ${mobileData.device_id}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to upsert user ${targetId}: ${error.message}`);
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

  async checkIdentity(email: string, mobile: string): Promise<boolean> {
    this.logger.log(`Checking identity availability for: Email=${email}, Mobile=${mobile}`);
    const count = await this.userModel.countDocuments({
      $or: [
        { email: email },
        { mobile_number: mobile },
      ],
    }).exec();
    return count > 0;
  }
}
