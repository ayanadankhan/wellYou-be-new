// src/recruitment/reporting/reporting.controller.ts
import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { RecruitmentMetricsQueryDto } from './dto/recruitment-metrics-query.dto';
import {
  IApplicationsOverview,
  IInterviewSuccessRate,
  ITimeToHire,
  IRecruitmentDashboardSummary,
} from './interfaces/reporting.interface';

@ApiTags('Recruitment Reports')
@Controller('reports')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ReportingController {
  private readonly logger = new Logger(ReportingController.name);

  constructor(private readonly reportingService: ReportingService) {}

  @Get('applications-overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an overview of job applications metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String,  description: 'Filter data from this date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String,  description: 'Filter data up to this date (ISO 8601)' })
  @ApiQuery({ name: 'jobPositionId', required: false, type: String, description: 'Filter by specific job position' })
  @ApiQuery({ name: 'department', required: false, type: String, description: 'Filter by specific department' })
  @ApiResponse({ status: 200, description: 'Overview of application metrics.', type: Object }) // Type is IApplicationsOverview
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getApplicationsOverview(
    @Query() queryDto: RecruitmentMetricsQueryDto
  ): Promise<IApplicationsOverview> {
    this.logger.log('Received request for applications overview report.');
    return this.reportingService.getApplicationsOverview(queryDto);
  }

  @Get('interview-success-rate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get interview success rate metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String,  description: 'Filter data from this date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String,  description: 'Filter data up to this date (ISO 8601)' })
  @ApiQuery({ name: 'jobPositionId', required: false, type: String, description: 'Filter by specific job position' })
  @ApiQuery({ name: 'department', required: false, type: String, description: 'Filter by specific department' })
  @ApiResponse({ status: 200, description: 'Interview success rate metrics.', type: Object }) // Type is IInterviewSuccessRate
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getInterviewSuccessRate(
    @Query() queryDto: RecruitmentMetricsQueryDto
  ): Promise<IInterviewSuccessRate> {
    this.logger.log('Received request for interview success rate report.');
    return this.reportingService.getInterviewSuccessRate(queryDto);
  }

  @Get('time-to-hire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get time-to-hire metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String,  description: 'Filter data from this date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String,  description: 'Filter data up to this date (ISO 8601)' })
  @ApiQuery({ name: 'jobPositionId', required: false, type: String, description: 'Filter by specific job position' })
  @ApiQuery({ name: 'department', required: false, type: String, description: 'Filter by specific department' })
  @ApiResponse({ status: 200, description: 'Time-to-hire metrics.', type: Object }) // Type is ITimeToHire
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getTimeToHire(
    @Query() queryDto: RecruitmentMetricsQueryDto
  ): Promise<ITimeToHire> {
    this.logger.log('Received request for time-to-hire report.');
    return this.reportingService.getTimeToHire(queryDto);
  }

  @Get('dashboard-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get combined recruitment dashboard summary' })
  @ApiQuery({ name: 'startDate', required: false, type: String,  description: 'Filter data from this date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String,  description: 'Filter data up to this date (ISO 8601)' })
  @ApiQuery({ name: 'jobPositionId', required: false, type: String, description: 'Filter by specific job position' })
  @ApiQuery({ name: 'department', required: false, type: String, description: 'Filter by specific department' })
  @ApiResponse({ status: 200, description: 'Combined recruitment dashboard summary.', type: Object }) // Type is IRecruitmentDashboardSummary
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getRecruitmentDashboardSummary(
    @Query() queryDto: RecruitmentMetricsQueryDto
  ): Promise<IRecruitmentDashboardSummary> {
    this.logger.log('Received request for recruitment dashboard summary.');
    return this.reportingService.getRecruitmentDashboardSummary(queryDto);
  }
}
