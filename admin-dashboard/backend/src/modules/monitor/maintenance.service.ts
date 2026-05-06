import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interview } from '../interviews/interview.schema';
import { Ticket } from '../tickets/ticket.schema';
import { User } from '../users/user.schema';
import { PersonalizedQuestion } from '../questions/question.schema';

import { Job } from '../jobs/job.schema';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectModel(Interview.name) private interviewModel: Model<Interview>,
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PersonalizedQuestion.name) private pQuestionModel: Model<PersonalizedQuestion>,
    @InjectModel(Job.name) private jobModel: Model<Job>,
  ) {}

  async getHealthSummary() {
    const [interviews, tickets, users, pQuestions] = await Promise.all([
      this.interviewModel.find().exec(),
      this.ticketModel.find().exec(),
      this.userModel.find().exec(),
      this.pQuestionModel.find().exec(),
    ]);

    const userIds = new Set(users.map(u => u._id));
    
    const orphanedInterviews = interviews.filter(iv => !userIds.has(iv.user_id));
    const prefixedInterviews = interviews.filter(iv => iv.user_id?.startsWith('user_')).length;
    const rawInterviews = interviews.filter(iv => iv.user_id && !iv.user_id.startsWith('user_')).length;

    const orphanedTickets = tickets.filter(t => !userIds.has(t.user_id));
    const orphanedPQs = pQuestions.filter(q => !userIds.has(q.user_id));

    return {
      total_records: {
        users: users.length,
        interviews: interviews.length,
        tickets: tickets.length,
        personalized_questions: pQuestions.length,
      },
      mapping_health: {
        interviews_with_prefix: prefixedInterviews,
        interviews_missing_prefix: rawInterviews,
        orphaned_interviews: orphanedInterviews.length,
        orphaned_tickets: orphanedTickets.length,
        orphaned_personalized_questions: orphanedPQs.length,
      }
    };
  }

  async runMigration() {
    this.logger.log('Starting Data Migration: Standardizing User IDs...');
    
    // 1. Standardize Interviews
    const interviews = await this.interviewModel.find({ user_id: { $not: /^user_/ } }).exec();
    for (const iv of interviews) {
      if (iv.user_id) {
        await this.interviewModel.updateOne({ _id: iv._id }, { $set: { user_id: `user_${iv.user_id}` } });
      }
    }

    // 2. Standardize Tickets
    const tickets = await this.ticketModel.find({ user_id: { $not: /^user_/ } }).exec();
    for (const t of tickets) {
      if (t.user_id) {
        await this.ticketModel.updateOne({ _id: t._id }, { $set: { user_id: `user_${t.user_id}` } });
      }
    }

    // 3. Standardize Personalized Questions
    const pqs = await this.pQuestionModel.find({ user_id: { $not: /^user_/ } }).exec();
    for (const pq of pqs) {
      if (pq.user_id) {
        await this.pQuestionModel.updateOne({ _id: pq._id }, { $set: { user_id: `user_${pq.user_id}` } });
      }
    }

    return {
      success: true,
      migrated: {
        interviews: interviews.length,
        tickets: tickets.length,
        personalized_questions: pqs.length,
      }
    };
  }

  async autoCreateMissingUsers() {
    this.logger.log('Starting Auto-Profile Creation for orphaned records...');
    const interviews = await this.interviewModel.find().exec();
    const users = await this.userModel.find().exec();
    const userIds = new Set(users.map(u => u._id));

    let createdCount = 0;
    for (const iv of interviews) {
      if (iv.user_id && !userIds.has(iv.user_id)) {
        try {
          const rawId = iv.user_id.replace('user_', '');
          const fallbackName = rawId.includes('@') ? rawId.split('@')[0] : `Candidate ${rawId.slice(-6)}`;

          await this.userModel.create({
            _id: iv.user_id,
            name: fallbackName,
            device_id: rawId,
            last_active_at: iv.created_at || new Date(),
            preferences: {
              target_role: iv.role || 'Guest Candidate'
            }
          });
          userIds.add(iv.user_id);
          createdCount++;
        } catch (e) {
          this.logger.error(`Failed to create user for ${iv.user_id}: ${e.message}`);
        }
      }
    }
    return { success: true, created_profiles: createdCount };
  }

  async linkInterviewsToJobs() {
    this.logger.log('Starting Job-to-Interview linking migration...');
    const interviews = await this.interviewModel.find({ job_id: { $exists: false } }).exec();
    const jobs = await this.jobModel.find().exec();
    const jobTitleMap = new Map(jobs.map(j => [j.title, j.job_id]));

    let linkedCount = 0;
    for (const iv of interviews) {
      if (iv.role && jobTitleMap.has(iv.role)) {
        await this.interviewModel.updateOne({ _id: iv._id }, { $set: { job_id: jobTitleMap.get(iv.role) } });
        linkedCount++;
      }
    }
    return { success: true, linked_records: linkedCount };
  }

  async cleanOrphanedQuestions() {
    this.logger.log('Starting Cleanup of Orphaned Personalized Questions...');
    const users = await this.userModel.find().exec();
    const userIds = new Set(users.map(u => u._id));
    
    const result = await this.pQuestionModel.deleteMany({
      user_id: { $nin: Array.from(userIds) }
    }).exec();

    return { success: true, deleted_count: result.deletedCount };
  }
}
