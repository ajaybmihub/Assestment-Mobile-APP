import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeneralQuestion, PersonalizedQuestion } from './question.schema';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    @InjectModel(GeneralQuestion.name) private generalModel: Model<GeneralQuestion>,
    @InjectModel(PersonalizedQuestion.name) private personalizedModel: Model<PersonalizedQuestion>,
  ) {}

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
}
