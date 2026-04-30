import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class MobileDevice extends Document {
  @Prop({ required: true, unique: true })
  device_id: string;

  @Prop()
  device_name: string;

  @Prop()
  app_version: string;

  @Prop()
  cpu_cores: number;

  @Prop()
  total_ram: string;

  @Prop()
  processor: string;

  @Prop({ type: String, ref: 'User' })
  user_id: string;

  @Prop()
  last_sync_at: Date;
}

export const MobileDeviceSchema = SchemaFactory.createForClass(MobileDevice);
