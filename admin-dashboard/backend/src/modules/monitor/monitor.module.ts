import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitorController } from './monitor.controller';
import { MaintenanceService } from './maintenance.service';
import { Interview, InterviewSchema } from '../interviews/interview.schema';
import { User, UserSchema } from '../users/user.schema';
import { Ticket, TicketSchema } from '../tickets/ticket.schema';
import { PersonalizedQuestion, PersonalizedQuestionSchema } from '../questions/question.schema';

import { Job, JobSchema } from '../jobs/job.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interview.name, schema: InterviewSchema },
      { name: User.name, schema: UserSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: PersonalizedQuestion.name, schema: PersonalizedQuestionSchema },
      { name: Job.name, schema: JobSchema },
    ]),
  ],
  controllers: [MonitorController],
  providers: [MaintenanceService],
})
export class MonitorModule {}
