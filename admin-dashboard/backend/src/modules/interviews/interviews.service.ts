import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interview } from './interview.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    @InjectModel(Interview.name) private interviewModel: Model<Interview>,
    private readonly usersService: UsersService,
  ) {}

  async upsertInterview(data: any): Promise<any> {
    this.logger.log(`Upserting interview session: ${data._id}`);
    
    // Also update parent user's last active
    if (data.user_id) {
      await this.usersService.upsertUser({ _id: data.user_id });
    }

    const { _id, ...updateData } = data;
    return this.interviewModel.updateOne(
      { _id: _id },
      { $set: updateData },
      { upsert: true },
    ).exec();
  }

  async findAll(page: number = 1, limit: number = 100): Promise<Interview[]> {
    return this.interviewModel
      .find()
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<Interview | null> {
    return this.interviewModel.findOne({ _id: id }).exec();
  }

  async countAll(): Promise<number> {
    return this.interviewModel.countDocuments().exec();
  }

  async updateVideoUrl(sessionId: string, videoUrl: string): Promise<any> {
    this.logger.log(`[SYNC] Updating video URL for session ${sessionId}`);
    const result = await this.interviewModel.updateOne(
      { _id: sessionId },
      { 
        $set: { video_url: videoUrl },
        $setOnInsert: { created_at: new Date() } // Fallback for early video sync
      },
      { upsert: true }
    ).exec();
    
    this.logger.log(`[SYNC] Update result for ${sessionId}: matched=${result.matchedCount}, modified=${result.modifiedCount}, upserted=${result.upsertedCount}`);
    return result;
  }
}
