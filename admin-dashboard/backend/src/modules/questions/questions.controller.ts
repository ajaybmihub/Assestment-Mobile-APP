import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  private readonly logger = new Logger(QuestionsController.name);

  constructor(private readonly questionsService: QuestionsService) {}

  @Get('serve')
  async serveQuestions(
    @Query('userId') userId: string,
    @Query('difficulty') difficulty: string,
    @Query('jobId') jobId?: string,
    @Query('limit') limit: number = 10,
  ) {
    const jobNum = jobId ? parseInt(jobId, 10) : undefined;
    this.logger.log(`Serving questions for user: ${userId} for job: ${jobNum} at level: ${difficulty}`);
    const questions = await this.questionsService.getQuestionsForUser(userId, difficulty, jobNum, limit);
    return {
        success: true,
        count: questions.length,
        questions
    };
  }

  @Post('mark-attempted')
  async markAttempted(
    @Body() payload: { userId: string, questionIds: string[] }
  ) {
    this.logger.log(`Marking questions attempted for user: ${payload.userId}`);
    await this.questionsService.markQuestionsAsAttempted(payload.userId, payload.questionIds);
    return { success: true };
  }
}
