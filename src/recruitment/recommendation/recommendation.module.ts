import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JobPosting, JobPostingSchema } from '../job-position/schemas/job-position.schema';

import { CandidateProfile, CandidateProfileSchema } from '../candidate-profile/entities/candidate-profile.entity';
import { Application, ApplicationSchema } from '../application/schemas/application.schema';
import { JobPostingService } from '../job-position/job-position.service';
import { CandidateProfileService } from '../candidate-profile/candidate-profile.service';
import { JobApplicationService } from '../application/job-application.service';
import { AiExtractionService } from '../job-position/ai-extraction.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobPosting.name, schema: JobPostingSchema},
      { name: CandidateProfile.name, schema: CandidateProfileSchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
  ],
  providers: [
    RecommendationService,
    // We need to provide these services here if RecommendationService depends on them
    // AND RecommendationModule is not importing the modules that already provide them.
    // For simplicity, we're providing them directly here, assuming RecruitmentModule
    // exports them or they are also provided in the root. If you prefer to import
    // existing modules (e.g., JobPositionModule), that's also a valid approach.
    JobPostingService,
    AiExtractionService,
    CandidateProfileService,
    JobApplicationService,
  ],
  controllers: [RecommendationController],
  exports: [RecommendationService], // Export RecommendationService if other modules might use it
})
export class RecommendationModule {}