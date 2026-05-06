import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { InterviewsModule } from '../interviews/interviews.module';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    InterviewsModule,
    UsersModule,
    AiModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
