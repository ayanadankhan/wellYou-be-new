
// src/job-posting/job-posting.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobPostingController } from './job-position.controller';
import { JobPostingService } from './job-position.service';
import { AiExtractionService } from './ai-extraction.service';
import { JobPosting, JobPostingSchema } from './schemas/job-position.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobPosting.name, schema: JobPostingSchema }
    ])
  ],
  controllers: [JobPostingController],
  providers: [JobPostingService, AiExtractionService],
  exports: [JobPostingService, AiExtractionService], // Export services if other modules need them
})
export class JobPositionModule {}