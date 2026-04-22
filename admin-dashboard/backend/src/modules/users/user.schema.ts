import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String })
  _id: string; // user_<deviceId>

  @Prop() name: string;
  @Prop() email: string;
  @Prop() mobile_number: string;
  @Prop() device_id: string;
  @Prop() device_name: string; // Human readable name like 'Pixel 7 Pro'
  @Prop() app_version: string;
  
  @Prop({ type: Object })
  preferences: {
    target_role?: string;
    preferred_job?: string;
    experience_level?: string;
    is_notifications_enabled?: boolean;
    sync_on_wifi_only?: boolean;
  };

  @Prop() resume_text: string;
  @Prop() resume_summary: string;
  @Prop({ type: [String] })
  personalized_questions: string[];

  @Prop() last_active_at: Date;
  @Prop() last_sync_at: Date;
}

export const UserSchema: MongooseSchema = SchemaFactory.createForClass(User);
