import { Module } from '@nestjs/common';
import { JobPositionModule } from './job-position/job-position.module';
import { ApplicationModule } from './application/application.module';
import { InterviewModule } from './interview/interview.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [ // Modules must be listed inside the 'imports' array
    JobPositionModule,
    ApplicationModule,
    InterviewModule,
    ReportingModule,
  ],
  controllers: [],
  providers: [],
  exports: [ // It's often useful to export these modules if they'll be used by other modules importing RecruitmentModule
    JobPositionModule,
    ApplicationModule,
    InterviewModule,
    ReportingModule,
  ],
})
export class RecruitmentModule {}