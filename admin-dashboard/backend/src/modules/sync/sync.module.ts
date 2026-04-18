import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { InterviewsModule } from '../interviews/interviews.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [InterviewsModule, UsersModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
