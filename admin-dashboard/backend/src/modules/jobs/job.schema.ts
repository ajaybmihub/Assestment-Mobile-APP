import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Job extends Document {
  @Prop({ required: true, unique: true })
  job_id: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  category: string; // e.g. "Software Development"

  @Prop({ default: 'Beginner' })
  difficulty: string;

  @Prop({ type: [String] })
  required_skills: string[];
}

export const JobSchema = SchemaFactory.createForClass(Job);
