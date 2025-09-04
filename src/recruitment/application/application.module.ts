// src/recruitment/application/application.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationController } from './job-application.controller';
import { JobApplicationService } from './job-application.service'; // Renamed service
import { Application, ApplicationSchema } from './schemas/application.schema';
import { JobPositionModule } from '../job-position/job-position.module'; // Import JobPositionModule if it exists
import { CandidateProfileModule } from '../candidate-profile/candidate-profile.module'; // Crucial: Import CandidateProfileModule
import { TestExtractionController } from './test-extraction.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]),
    JobPositionModule, // Make sure JobPositionModule exports JobPositionService
    CandidateProfileModule, // Make sure CandidateProfileModule exports CandidateProfileService
  ],
  controllers: [ApplicationController, TestExtractionController],
  providers: [JobApplicationService],
  exports: [JobApplicationService], // Export JobApplicationService if other modules depend on it
})
export class ApplicationModule {}