import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async upsertUser(data: any): Promise<any> {
    this.logger.log(`Upserting user profile: ${data._id}`);
    const { _id, ...rest } = data;
    const update = { 
      ...rest,
      last_active_at: new Date(), // Always update last active
    };
    return this.userModel.updateOne(
      { _id: _id },
      { $set: update },
      { upsert: true },
    ).exec();
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
