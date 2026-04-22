import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false, timestamps: true })
class ChatMessage {
  @Prop() role: string;
  @Prop() content: string;
  @Prop() timestamp: Date;
  @Prop() question_source?: string; // 'general' or 'personalized'
}

@Schema({ timestamps: true })
export class Interview {
  @Prop({ type: String })
  _id: string; // sess_<id>_<deviceId>

  @Prop() user_id: string;
  @Prop() device_id: string;
  @Prop() device_name: string;
  @Prop() role: string;

  @Prop({ type: Object })
  scores: {
    overall: string;
    technical_accuracy?: number;
    structure_clarity?: number;
    answer_relevance?: number;
    depth_completeness?: number;
    focus_score?: number;
  };

  @Prop({ type: [Object] })
  chat_history: ChatMessage[];

  @Prop() video_url: string;

  @Prop({ type: Object })
  proctoring: {
    no_face: number;
    multiple_faces: number;
    head_rotation: number;
  };

  @Prop() start_time: Date;
  @Prop() end_time: Date;
  @Prop() created_at: Date;
}

import { Schema as MongooseSchema } from 'mongoose';
export const InterviewSchema: MongooseSchema = SchemaFactory.createForClass(Interview);
