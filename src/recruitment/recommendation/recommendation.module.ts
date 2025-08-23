import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JobPosition, JobPositionSchema } from '../job-position/schemas/job-position.schema';
import { CandidateProfile, CandidateProfileSchema } from '../candidate-profile/entities/candidate-profile.entity';
import { Application, ApplicationSchema } from '../application/schemas/application.schema';
import { JobPositionService } from '../job-position/job-position.service';
import { CandidateProfileService } from '../candidate-profile/candidate-profile.service';
import { JobApplicationService } from '../application/job-application.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobPosition.name, schema: JobPositionSchema },
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
    JobPositionService,
    CandidateProfileService,
    JobApplicationService,
  ],
  controllers: [RecommendationController],
  exports: [RecommendationService], // Export RecommendationService if other modules might use it
})
export class RecommendationModule {}