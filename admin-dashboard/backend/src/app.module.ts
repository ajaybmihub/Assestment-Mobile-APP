import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SyncModule } from './modules/sync/sync.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { UsersModule } from './modules/users/users.module';
import { MediaModule } from './modules/media/media.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { MonitorModule } from './modules/monitor/monitor.module';
import { AiModule } from './modules/ai/ai.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { JobsModule } from './modules/jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    SyncModule,
    InterviewsModule,
    UsersModule,
    MediaModule,
    TicketsModule,
    MonitorModule,
    AiModule,
    QuestionsModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
