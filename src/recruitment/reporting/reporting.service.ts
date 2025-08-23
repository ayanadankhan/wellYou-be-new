// src/recruitment/reporting/reporting.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Application, IApplicationDocument } from '../application/schemas/application.schema';
import { Interview, IInterviewDocument } from 'src/recruitment/interview/schemas/interview.schema';
import { JobPosition, IJobPositionDocument } from 'src/recruitment/job-position/schemas/job-position.schema';
import { RecruitmentMetricsQueryDto } from './dto/recruitment-metrics-query.dto';
import {
  IApplicationsOverview,
  IInterviewSuccessRate,
  ITimeToHire,
  IRecruitmentDashboardSummary,
} from './interfaces/reporting.interface';
import { ApplicationStatus, InterviewType } from 'src/recruitment/shared/enums';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<IApplicationDocument>,
    @InjectModel(Interview.name) private readonly interviewModel: Model<IInterviewDocument>,
    @InjectModel(JobPosition.name) private readonly jobPositionModel: Model<IJobPositionDocument>,
  ) {}

  private buildDateFilter(startDate?: string, endDate?: string, dateField: string = 'createdAt'): any {
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate); // MongoDB $gte operator
    }
    if (endDate) {
      // Set end date to end of day to include all records on endDate
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter.$lte = end; // MongoDB $lte operator
    }
    return Object.keys(dateFilter).length > 0 ? { [dateField]: dateFilter } : {};
  }

  private buildCommonFilters(queryDto: RecruitmentMetricsQueryDto): any {
    const commonFilters: any = {};
    if (queryDto.jobPositionId) {
      commonFilters.jobPosition = new Types.ObjectId(queryDto.jobPositionId);
    }
    if (queryDto.department) {
      // Department filter needs to be handled within aggregation pipelines
      // by using $lookup and $match on the joined collection.
      // It's not a direct filter on Application or Interview models.
    }
    return commonFilters;
  }

  /**
   * Generates an overview report for applications.
   * @param queryDto Filters for the report.
   * @returns Applications overview data.
   */
  async getApplicationsOverview(queryDto: RecruitmentMetricsQueryDto): Promise<IApplicationsOverview> {
    try {
      this.logger.log(`Generating applications overview with filters: ${JSON.stringify(queryDto)}`);

      const commonFilters = this.buildCommonFilters(queryDto);
      const dateFilter = this.buildDateFilter(queryDto.startDate, queryDto.endDate, 'appliedDate');

      // Base match stage
      const baseMatchStage: PipelineStage.Match = {
        $match: {
          isDeleted: false,
          ...commonFilters,
          ...dateFilter,
        },
      };

      // Handle department filter by joining with JobPosition
      let pipeline: PipelineStage[] = [];
      if (queryDto.department) {
        pipeline.push(
          {
            $lookup: {
              from: 'jobpositions', // The collection name for JobPosition
              localField: 'jobPosition',
              foreignField: '_id',
              as: 'jobPositionDetails',
            },
          },
          {
            $unwind: { path: '$jobPositionDetails', preserveNullAndEmptyArrays: false }, // Unwind to match department
          },
          {
            $match: {
              'jobPositionDetails.department': new RegExp(queryDto.department, 'i'),
            },
          },
          {
            $project: { // Project original fields back if needed after unwind
                jobPositionDetails: 0 // Exclude jobPositionDetails from the final output of this stage
            }
          }
        );
      }
      pipeline.push(baseMatchStage); // Add base match after potential lookups

      const [
        totalApplicationsResult,
        applicationsByStatusResult,
        applicationsByJobPositionResult,
        applicationsBySourceResult,
        avgExperienceYearsResult,
      ] = await Promise.all([
        this.applicationModel.aggregate([...pipeline, { $count: 'total' }]).exec(), // $count operator
        this.applicationModel.aggregate([...pipeline, { $group: { _id: '$status', count: { $sum: 1 } } }]).exec(), // $group, $sum operators
        this.applicationModel.aggregate([
            ...pipeline,
            {
              $lookup: {
                from: 'jobpositions', // Collection name
                localField: 'jobPosition',
                foreignField: '_id',
                as: 'jobPositionInfo',
              },
            },
            { $unwind: { path: '$jobPositionInfo', preserveNullAndEmptyArrays: true } }, // $unwind operator
            {
              $group: {
                _id: '$jobPosition', // Group by jobPosition ID
                title: { $first: '$jobPositionInfo.title' }, // Get the job title from the first document in the group
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, jobPositionId: '$_id', title: 1, count: 1 } }, // $project operator, map _id to jobPositionId
            { $sort: { count: -1 } }, // $sort operator
          ]).exec(),
        this.applicationModel.aggregate([...pipeline, { $group: { _id: '$source', count: { $sum: 1 } } }, { $project: { _id: 0, source: '$_id', count: 1 } }, { $sort: { count: -1 } }]).exec(),
        this.applicationModel.aggregate([...pipeline, { $group: { _id: null, avgYears: { $avg: '$experienceYears' } } }]).exec(), // $avg operator
      ]);

      const totalApplications = totalApplicationsResult[0]?.total || 0;
      const applicationsByStatus: { [status in ApplicationStatus]?: number } = {};
      applicationsByStatusResult.forEach(item => {
        applicationsByStatus[item._id as ApplicationStatus] = item.count;
      });

      const applicationsByJobPosition = applicationsByJobPositionResult;
      const applicationsBySource = applicationsBySourceResult;
      const avgExperienceYears = avgExperienceYearsResult[0]?.avgYears || 0;

      this.logger.log('Applications overview generated successfully.');
      return {
        totalApplications,
        applicationsByStatus,
        applicationsByJobPosition,
        applicationsBySource,
        avgExperienceYears: parseFloat(avgExperienceYears.toFixed(2)),
      };
    } catch (error) {
      this.logger.error(`Failed to generate applications overview report: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate applications overview report.');
    }
  }

  //------------------------------------------------------------------------------------------------------------------

  /**
   * Calculates the interview success rate.
   * Success defined as applications reaching 'HIRED' status after an interview.
   * @param queryDto Filters for the report.
   * @returns Interview success rate data.
   */
  async getInterviewSuccessRate(queryDto: RecruitmentMetricsQueryDto): Promise<IInterviewSuccessRate> {
    try {
      this.logger.log(`Generating interview success rate with filters: ${JSON.stringify(queryDto)}`);

      const commonFilters = this.buildCommonFilters(queryDto);
      const dateFilter = this.buildDateFilter(queryDto.startDate, queryDto.endDate, 'scheduledDate');

      // Match stage for interviews
      const interviewMatchStage: PipelineStage.Match = {
        $match: {
          isDeleted: false,
          ...commonFilters,
          ...dateFilter,
        },
      };

      // For department filter, we need to join application and job position data
      let interviewPipeline: PipelineStage[] = [];
      if (queryDto.department) {
        interviewPipeline.push(
          {
            $lookup: {
              from: 'applications',
              localField: 'application',
              foreignField: '_id',
              as: 'applicationDetails',
            },
          },
          { $unwind: { path: '$applicationDetails', preserveNullAndEmptyArrays: false } },
          {
            $lookup: {
              from: 'jobpositions',
              localField: 'applicationDetails.jobPosition',
              foreignField: '_id',
              as: 'jobPositionDetails',
            },
          },
          { $unwind: { path: '$jobPositionDetails', preserveNullAndEmptyArrays: false } },
          {
            $match: {
              'jobPositionDetails.department': new RegExp(queryDto.department, 'i'),
            },
          },
          {
            $project: { // Project original fields back if needed after unwind
                applicationDetails: 0,
                jobPositionDetails: 0
            }
          }
        );
      }
      interviewPipeline.push(interviewMatchStage); // Add base match after potential lookups


      const [
        totalInterviewsScheduledResult,
        interviewsByTypeResult,
      ] = await Promise.all([
        this.interviewModel.aggregate([...interviewPipeline, { $count: 'total' }]).exec(), // $count operator
        this.interviewModel.aggregate([...interviewPipeline, { $group: { _id: '$type', count: { $sum: 1 } } }]).exec(), // $group, $sum operators
      ]);

      const totalInterviewsScheduled = totalInterviewsScheduledResult[0]?.total || 0;
      // You should apply the same filters to totalInterviewsCompleted as the pipeline
      const totalInterviewsCompleted = (await this.interviewModel.countDocuments({
        ...interviewMatchStage.$match, // Access the actual match criteria
        status: 'Completed'
      })) || 0;

      const interviewsByType: { [type in InterviewType]?: number } = {};
      interviewsByTypeResult.forEach(item => {
        interviewsByType[item._id as InterviewType] = item.count;
      });

      // Count hired applications that had an interview within the date range
      // This requires joining applications and interviews
      const hiredFromInterviewPipeline: PipelineStage[] = [
        {
          $match: {
            isDeleted: false,
            status: ApplicationStatus.HIRED,
            ...this.buildDateFilter(queryDto.startDate, queryDto.endDate, 'hireDate'), // Filter applications by their hire date
            ...this.buildCommonFilters(queryDto), // Common filters like jobPositionId
          },
        },
      ];

      if (queryDto.department) {
        hiredFromInterviewPipeline.unshift( // Use unshift to add to the beginning of the pipeline
          {
            $lookup: {
              from: 'jobpositions',
              localField: 'jobPosition',
              foreignField: '_id',
              as: 'jobPositionDetails',
            },
          },
          { $unwind: { path: '$jobPositionDetails', preserveNullAndEmptyArrays: false } },
          {
            $match: {
              'jobPositionDetails.department': new RegExp(queryDto.department, 'i'),
            },
          },
          {
            $project: {
                jobPositionDetails: 0
            }
          }
        );
      }

      const hiredApplications = await this.applicationModel.aggregate([
        ...hiredFromInterviewPipeline,
        {
          $lookup: {
            from: 'interviews',
            localField: '_id',
            foreignField: 'application',
            as: 'relatedInterviews',
          },
        },
        {
          $match: {
            'relatedInterviews.0': { $exists: true }, // Ensure at least one interview exists
            // Further filter relatedInterviews by status if needed, e.g., 'relatedInterviews.status': 'Completed'
            // For example, if you only want to count applications hired AFTER a 'Completed' interview:
            // 'relatedInterviews.status': 'Completed'
          },
        },
        {
          $count: 'hiredCount', // $count operator
        },
      ]).exec();

      const hiredFromInterview = hiredApplications[0]?.hiredCount || 0;

      const successRate = totalInterviewsCompleted > 0 ? (hiredFromInterview / totalInterviewsCompleted) * 100 : 0;

      this.logger.log('Interview success rate generated successfully.');
      return {
        totalInterviewsScheduled,
        totalInterviewsCompleted,
        interviewsByType,
        hiredFromInterview,
        successRate: parseFloat(successRate.toFixed(2)),
      };
    } catch (error) {
      this.logger.error(`Failed to generate interview success rate report: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate interview success rate report.');
    }
  }

  //------------------------------------------------------------------------------------------------------------------

  /**
   * Calculates time-to-hire metrics.
   * @param queryDto Filters for the report.
   * @returns Time-to-hire data.
   */
  async getTimeToHire(queryDto: RecruitmentMetricsQueryDto): Promise<ITimeToHire> {
    try {
      this.logger.log(`Generating time-to-hire report with filters: ${JSON.stringify(queryDto)}`);

      const commonFilters = this.buildCommonFilters(queryDto);
      const dateFilter = this.buildDateFilter(queryDto.startDate, queryDto.endDate, 'hireDate');

      let pipeline: PipelineStage[] = [
        {
          $match: {
            isDeleted: false,
            status: ApplicationStatus.HIRED,
            appliedDate: { $ne: null }, // Ensure appliedDate exists and is not null
            hireDate: { $ne: null },    // Ensure hireDate exists and is not null
            ...commonFilters,
            ...dateFilter,
          },
        },
        {
          $addFields: { // $addFields operator to compute new fields
            timeToHireMs: { $subtract: ['$hireDate', '$appliedDate'] }, // Calculate difference in milliseconds
          },
        },
        {
          $addFields: {
            timeToHireDays: { $divide: ['$timeToHireMs', 1000 * 60 * 60 * 24] }, // Convert ms to days
          },
        },
      ];

      if (queryDto.department) {
        pipeline.unshift( // Unshift to add to the beginning of the pipeline
          {
            $lookup: {
              from: 'jobpositions',
              localField: 'jobPosition',
              foreignField: '_id',
              as: 'jobPositionDetails',
            },
          },
          { $unwind: { path: '$jobPositionDetails', preserveNullAndEmptyArrays: false } },
          {
            $match: {
              'jobPositionDetails.department': new RegExp(queryDto.department, 'i'),
            },
          },
          {
            $project: {
                jobPositionDetails: 0
            }
          }
        );
      }

      const [
        totalHiredApplicationsResult,
        avgTimeToHireResult,
        timeToHireByJobPositionResult,
        timeToHireByDepartmentResult,
        allTimeToHireDays, // To calculate median
      ] = await Promise.all([
        this.applicationModel.aggregate([...pipeline, { $count: 'total' }]).exec(), // $count operator
        this.applicationModel.aggregate([...pipeline, { $group: { _id: null, avgDays: { $avg: '$timeToHireDays' } } }]).exec(), // $avg operator
        this.applicationModel.aggregate([
          ...pipeline,
          {
            $lookup: {
              from: 'jobpositions',
              localField: 'jobPosition',
              foreignField: '_id',
              as: 'jobPositionInfo',
            },
          },
          { $unwind: { path: '$jobPositionInfo', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$jobPosition',
              title: { $first: '$jobPositionInfo.title' },
              avgDays: { $avg: '$timeToHireDays' },
            },
          },
          { $project: { _id: 0, jobPositionId: '$_id', title: 1, avgDays: { $round: ['$avgDays', 2] } } }, // $round operator
          { $sort: { avgDays: 1 } }, // Sort by avgDays ascending
        ]).exec(),
        this.applicationModel.aggregate([
          ...pipeline,
          {
            $lookup: {
              from: 'jobpositions',
              localField: 'jobPosition',
              foreignField: '_id',
              as: 'jobPositionInfo',
            },
          },
          { $unwind: { path: '$jobPositionInfo', preserveNullAndEmptyArrays: false } }, // Need non-null for department grouping
          {
            $group: {
              _id: '$jobPositionInfo.department', // Group by department name
              avgDays: { $avg: '$timeToHireDays' },
            },
          },
          { $project: { _id: 0, department: '$_id', avgDays: { $round: ['$avgDays', 2] } } },
          { $sort: { avgDays: 1 } },
        ]).exec(),
        this.applicationModel.aggregate([...pipeline, { $project: { _id: 0, timeToHireDays: 1 } }]).exec(),
      ]);

      const totalHiredApplications = totalHiredApplicationsResult[0]?.total || 0;
      const avgTimeToHireDays = avgTimeToHireResult[0]?.avgDays || 0;

      // Calculate Median Time to Hire
      let medianTimeToHireDays = 0;
      if (allTimeToHireDays.length > 0) {
        const sortedDays = allTimeToHireDays.map(item => item.timeToHireDays).sort((a, b) => a - b);
        const mid = Math.floor(sortedDays.length / 2);
        medianTimeToHireDays = sortedDays.length % 2 === 0
          ? (sortedDays[mid - 1] + sortedDays[mid]) / 2
          : sortedDays[mid];
      }

      this.logger.log('Time-to-hire report generated successfully.');
      return {
        totalHiredApplications,
        avgTimeToHireDays: parseFloat(avgTimeToHireDays.toFixed(2)),
        medianTimeToHireDays: parseFloat(medianTimeToHireDays.toFixed(2)),
        timeToHireByJobPosition: timeToHireByJobPositionResult,
        timeToHireByDepartment: timeToHireByDepartmentResult,
      };
    } catch (error) {
      this.logger.error(`Failed to generate time-to-hire report: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate time-to-hire report.');
    }
  }

  //------------------------------------------------------------------------------------------------------------------

  /**
   * Generates a combined summary for the recruitment dashboard.
   * @param queryDto Filters for the report.
   * @returns Combined recruitment dashboard summary.
   */
  async getRecruitmentDashboardSummary(queryDto: RecruitmentMetricsQueryDto): Promise<IRecruitmentDashboardSummary> {
    try {
      this.logger.log(`Generating recruitment dashboard summary with filters: ${JSON.stringify(queryDto)}`);

      const [applicationsOverview, interviewSuccessRate, timeToHire] = await Promise.all([
        this.getApplicationsOverview(queryDto),
        this.getInterviewSuccessRate(queryDto),
        this.getTimeToHire(queryDto),
      ]);

      this.logger.log('Recruitment dashboard summary generated successfully.');
      return {
        applicationsOverview,
        interviewSuccessRate,
        timeToHire,
      };
    } catch (error) {
      this.logger.error(`Failed to generate recruitment dashboard summary: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate recruitment dashboard summary.');
    }
  }
}