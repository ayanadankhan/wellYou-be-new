// src/recruitment/reporting/reporting.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { Application, ApplicationSchema } from 'src/recruitment/application/schemas/application.schema';
import { Interview, InterviewSchema } from 'src/recruitment/interview/schemas/interview.schema';
import { JobPosition, JobPositionSchema } from 'src/recruitment/job-position/schemas/job-position.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: JobPosition.name, schema: JobPositionSchema },
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService], // Export ReportingService if other modules need it
})
export class ReportingModule {}
