import { Controller, Get, Param, Logger } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);

  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('jobs/:jobPositionId/applicants')
  @ApiOperation({ summary: 'Get ranked applicants for a specific job position' })
  @ApiParam({ name: 'jobPositionId', description: 'ID of the job position' })
  @ApiResponse({ status: 200, description: 'List of ranked applicants' })
  @ApiResponse({ status: 404, description: 'Job position not found' })
  async getRankedApplicantsForJob(
    @Param('jobPositionId') jobPositionId: string,
  ) {
    this.logger.log(`Request to get ranked applicants for job: ${jobPositionId}`);
    const rankedApplicants = await this.recommendationService.rankApplicantsForJob(jobPositionId);
    return rankedApplicants;
  }

  @Get('candidates/:candidateProfileId/jobs')
  @ApiOperation({ summary: 'Get recommended job positions for a specific candidate profile' })
  @ApiParam({ name: 'candidateProfileId', description: 'ID of the candidate profile' })
  @ApiResponse({ status: 200, description: 'List of recommended job positions' })
  @ApiResponse({ status: 404, description: 'Candidate profile not found' })
  async getRecommendedJobsForCandidate(
    @Param('candidateProfileId') candidateProfileId: string,
  ) {
    this.logger.log(`Request to get recommended jobs for candidate: ${candidateProfileId}`);
    const recommendedJobs = await this.recommendationService.recommendJobsForCandidate(candidateProfileId);
    return recommendedJobs;
  }
}