import { Controller, Get, Post, Body, Query, Param, Logger } from '@nestjs/common';
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

  // --- Admin MCQ Management ---

  @Post('mcq')
  async createMcq(@Body() data: any) {
    return this.questionsService.createMcq(data);
  }

  @Get('mcq')
  async getMcqs(@Query('topic') topic?: string) {
    const questions = await this.questionsService.getAllMcqs(topic);
    return {
      success: true,
      count: questions.length,
      questions
    };
  }

  @Post('mcq/:id')
  async updateMcq(@Param('id') id: string, @Body() data: any) {
    return this.questionsService.updateMcq(id, data);
  }

  @Get('sync/mcq')
  async syncMcqs(@Query('lastSync') lastSync?: string) {
    const date = lastSync ? new Date(lastSync) : undefined;
    const questions = await this.questionsService.getMcqSyncData(date);
    return {
        success: true,
        count: questions.length,
        questions
    };
  }
}
