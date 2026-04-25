import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class McqQuestion extends Document {
  @Prop({ required: true })
  domain: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  subtopic: string;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [{ option: String, value: String }], required: true })
  options: { option: string; value: string }[];

  @Prop({ required: true })
  correct_answer: string;

  @Prop({ required: true })
  difficulty: string;

  @Prop({ type: [String], default: [] })
  imageUrls: string[];

  @Prop()
  companies?: string;

  @Prop()
  citations?: string;

  @Prop()
  source?: string;
  
  @Prop({ default: false })
  isActive: boolean;
}

export const McqQuestionSchema = SchemaFactory.createForClass(McqQuestion);
