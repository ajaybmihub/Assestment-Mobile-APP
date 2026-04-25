import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeneralQuestion, PersonalizedQuestion } from './question.schema';
import { McqQuestion } from './mcq-question.schema';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    @InjectModel(GeneralQuestion.name) private generalModel: Model<GeneralQuestion>,
    @InjectModel(PersonalizedQuestion.name) private personalizedModel: Model<PersonalizedQuestion>,
    @InjectModel(McqQuestion.name) private mcqModel: Model<McqQuestion>,
  ) {}

  // --- MCQ Management ---

  async createMcq(data: Partial<McqQuestion>) {
    this.logger.log(`Creating new MCQ question in ${data.topic}`);
    const newQ = new this.mcqModel(data);
    return newQ.save();
  }

  async updateMcq(id: string, data: Partial<McqQuestion>) {
    this.logger.log(`Updating MCQ question: ${id}`);
    return this.mcqModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async deleteMcq(id: string) {
    this.logger.log(`Deleting MCQ question: ${id}`);
    return this.mcqModel.findByIdAndDelete(id).exec();
  }

  async getAllMcqs(topic?: string, limit: number = 100) {
    const query = topic ? { topic } : {};
    return this.mcqModel.find(query).sort({ updatedAt: -1 }).limit(limit).exec();
  }

  async getMcqSyncData(lastSyncDate?: Date) {
    const query = lastSyncDate ? { updatedAt: { $gt: lastSyncDate } } : {};
    return this.mcqModel.find(query).exec();
  }

  async saveGeneralQuestions(jobId: number, questions: string[], difficulty: string = 'Beginner') {
    this.logger.log(`Saving ${questions.length} general questions for job: ${jobId}`);
    for (let i = 0; i < questions.length; i++) {
        const qText = questions[i];
        await this.generalModel.updateOne(
            { job_id: jobId, question: qText },
            { 
                $set: { 
                    question_id: `gen_${jobId}_${Date.now()}_${i}`,
                    difficulty,
                    updatedAt: new Date()
                },
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        ).exec();
    }
  }

  async savePersonalizedQuestions(userId: string, jobId: number, questions: string[], difficulty: string = 'Intermediate') {
    this.logger.log(`Saving ${questions.length} personalized questions for user: ${userId}`);
    for (let i = 0; i < questions.length; i++) {
        const qText = questions[i];
        await this.personalizedModel.updateOne(
            { user_id: userId, job_id: jobId, question: qText },
            { 
                $set: { 
                    question_id: `pers_${userId}_${Date.now()}_${i}`,
                    difficulty,
                    updatedAt: new Date()
                },
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        ).exec();
    }
  }

  async getQuestionsForUser(userId: string, difficulty: string, jobId?: number, limit: number = 10) {
    this.logger.log(`Fetching questions for user: ${userId}, Job: ${jobId}, Level: ${difficulty}`);

    const personalizedQuery: any = {
        user_id: userId,
        difficulty: difficulty,
        isAttempted: false
    };
    if (jobId !== undefined) personalizedQuery.job_id = jobId;

    // 1. Fetch non-attempted personalized questions
    const personalized = await this.personalizedModel.find(personalizedQuery).limit(limit).exec();

    const generalQuery: any = {
        difficulty: difficulty,
        attempted_by: { $ne: userId }
    };
    if (jobId !== undefined) generalQuery.job_id = jobId;

    // 2. Fetch non-attempted general questions for this difficulty and job
    const general = await this.generalModel.find(generalQuery).limit(limit).exec();

    // 3. Combine both sets
    let combined = [...personalized, ...general];

    // 4. Shuffle the combined list
    combined = this.shuffleArray(combined);

    // 5. Slice to requested limit
    return combined.slice(0, limit);
  }

  async markQuestionsAsAttempted(userId: string, questionIds: string[]) {
    this.logger.log(`Marking questions as attempted for user: ${userId}`);
    
    for (const qId of questionIds) {
        if (qId.startsWith('pers_')) {
            await this.personalizedModel.updateOne(
                { question_id: qId },
                { $set: { isAttempted: true } }
            ).exec();
        } else {
            await this.generalModel.updateOne(
                { question_id: qId },
                { $addToSet: { attempted_by: userId } }
            ).exec();
        }
    }
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
