import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Ticket extends Document {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'open', enum: ['open', 'in-progress', 'resolved', 'closed'] })
  status: string;

  @Prop({ default: 'low', enum: ['low', 'medium', 'high', 'critical'] })
  priority: string;

  @Prop()
  category: string; // e.g., "technical", "app-bug", "account", "other"

  @Prop()
  device_info: string;

  @Prop()
  app_version: string;

  @Prop({ type: [Object], default: [] })
  activity_log: any[]; // Track status changes

  @Prop()
  resolution_notes: string;

  @Prop({ type: [String], default: [] })
  image_urls: string[];
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
