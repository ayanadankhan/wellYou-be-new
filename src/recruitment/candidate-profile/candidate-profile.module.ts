// src/recruitment/candidate-profile/candidate-profile.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CandidateProfileService } from './candidate-profile.service';
import { CandidateProfileController } from './candidate-profile.controller';
import { CandidateProfile, CandidateProfileSchema } from './entities/candidate-profile.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CandidateProfile.name, schema: CandidateProfileSchema }]),
  ],
  controllers: [CandidateProfileController],
  providers: [CandidateProfileService],
  exports: [CandidateProfileService], // Export so JobApplicationModule can inject it
})
export class CandidateProfileModule {}