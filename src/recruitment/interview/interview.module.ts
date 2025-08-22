// src/recruitment/interview/interview.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { Interview, InterviewSchema } from './schemas/interview.schema';
import { ApplicationModule } from 'src/recruitment/application/application.module'; // Dependency
import { JobPositionModule } from 'src/recruitment/job-position/job-position.module'; // Dependency

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Interview.name, schema: InterviewSchema }]),
    ApplicationModule, // Import ApplicationModule to use ApplicationService
    JobPositionModule, // Import JobPositionModule to use JobPositionService
  ],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService], // Export InterviewService if other modules need it
})
export class InterviewModule {}
