import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionsService } from './questions.service';
import { GeneralQuestion, GeneralQuestionSchema, PersonalizedQuestion, PersonalizedQuestionSchema } from './question.schema';
import { McqQuestion, McqQuestionSchema } from './mcq-question.schema';
import { QuestionsController } from './questions.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneralQuestion.name, schema: GeneralQuestionSchema },
      { name: PersonalizedQuestion.name, schema: PersonalizedQuestionSchema },
      { name: McqQuestion.name, schema: McqQuestionSchema },
    ]),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
