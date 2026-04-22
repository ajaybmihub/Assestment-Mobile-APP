import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionsService } from './questions.service';
import { GeneralQuestion, GeneralQuestionSchema, PersonalizedQuestion, PersonalizedQuestionSchema } from './question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneralQuestion.name, schema: GeneralQuestionSchema },
      { name: PersonalizedQuestion.name, schema: PersonalizedQuestionSchema },
    ]),
  ],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
