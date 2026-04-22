import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class GeneralQuestion extends Document {
  @Prop() question_id: string;
  @Prop() question: string;
  @Prop() job_id: number;
  @Prop() skill: string;
  @Prop() difficulty: string;
  @Prop({ default: false }) isAttempted: boolean;
}

export const GeneralQuestionSchema = SchemaFactory.createForClass(GeneralQuestion);

@Schema({ timestamps: true })
export class PersonalizedQuestion extends Document {
  @Prop() question_id: string;
  @Prop() question: string;
  @Prop() job_id: number;
  @Prop() user_id: string; // user_<deviceId>
  @Prop() skill: string;
  @Prop() difficulty: string;
  @Prop({ default: false }) isAttempted: boolean;
}

export const PersonalizedQuestionSchema = SchemaFactory.createForClass(PersonalizedQuestion);
