// src/recruitment/interview/interview.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { Interview, IInterviewDocument} from './schemas/interview.schema';
import { CreateInterviewDto, CreateInterviewerDto } from './dto/create-interview.dto';
import { InterviewQueryDto } from './dto/interview-query.dto';
import { IPaginatedResponse } from 'src/recruitment/shared/interfaces';
import { JobApplicationService } from '../application/job-application.service';
import { JobPostingService } from 'src/recruitment/job-position/job-position.service'; // Dependency
import { ApplicationStatus } from 'src/recruitment/shared/enums'; // For updating application status
import { IInterviewer } from './interfaces/interview.interface';
import { UpdateInterviewDto } from './dto/update-interview.dto';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    @InjectModel(Interview.name) private readonly interviewModel: Model<IInterviewDocument>,
    private readonly jobApplicationService: JobApplicationService,
    private readonly jobPositionService: JobPostingService,
  ) {}

  /**
   * Creates a new interview.
   * @param createInterviewDto Data for creating the interview.
   * @param createdBy Optional ID of the user creating the record.
   * @returns The created interview document.
   */
async createInterview(
    createInterviewDto: CreateInterviewDto,
    createdBy?: string
  ): Promise<IInterviewDocument> {
    this.logger.log(`Received request to create interview for application ${createInterviewDto.applicationId} and job position ${createInterviewDto.jobPositionId}.`);
    try {
      // 1. Validate Application and Job Position exist
      const application = await this.jobApplicationService.getApplicationById(createInterviewDto.applicationId);
      this.logger.log(`Creating interview for application ${createInterviewDto.applicationId} and job position ${createInterviewDto.jobPositionId}`);
      if (!application) {
        throw new NotFoundException(`Application with ID ${createInterviewDto.applicationId} not found.`); // Add message
      }
      const jobPosition = await this.jobPositionService.findOne(createInterviewDto.jobPositionId);
      this.logger.log(`Validating job position ${createInterviewDto.jobPositionId}`);
      if (!jobPosition) {
        throw new NotFoundException(`Job Position with ID ${createInterviewDto.jobPositionId} not found.`); // Add message
      }

      // Ensure the application is linked to the correct job position
      if (application.jobPosition._id.toString() !== createInterviewDto.jobPositionId) { // <<< FIX IS HERE
        throw new BadRequestException('Application does not belong to the specified job position.');
      }

      // Optional: Prevent scheduling interviews for rejected/hired applications, and enforce status transition
      if (application.status === ApplicationStatus.REJECTED) {
        throw new BadRequestException('Cannot schedule an interview for a rejected application.');
      }
      if (application.status === ApplicationStatus.HIRED) {
        throw new BadRequestException('Cannot schedule an interview for an already hired application.');
      }
      // You might also want to ensure it's "APPLIED" or "SCREENED" to schedule the *first* interview
      // and "INTERVIEW_SCHEDULED" or "PROCEED_TO_NEXT_ROUND" for *subsequent* interviews (rescheduling, next round)
      if (
        application.status !== ApplicationStatus?.APPLIED &&
        application.status !== ApplicationStatus?.SCREENED &&
        application.status !== ApplicationStatus.INTERVIEW_SCHEDULED && // For rescheduling
        application.status !== ApplicationStatus?.PROCEED_TO_NEXT_ROUND // For subsequent rounds
      ) {
        throw new BadRequestException(`Cannot schedule an interview for an application in status: ${application.status}.`);
      }


      // 2. Convert interviewer DTOs to schema format
      const interviewers: IInterviewer[] = createInterviewDto.interviewers.map(interviewerDto => ({
        userId: new Types.ObjectId(interviewerDto.userId),
        name: interviewerDto.name,
        email: interviewerDto.email,
        role: interviewerDto.role,
        feedback: interviewerDto.feedback,
        rating: interviewerDto.rating,
      }));

      // 3. Create Interview
      const newInterview = new this.interviewModel({
        ...createInterviewDto,
        application: new Types.ObjectId(createInterviewDto.applicationId),
        jobPosition: new Types.ObjectId(createInterviewDto.jobPositionId),
        interviewers: interviewers,
        status: 'Scheduled', // Default status (as per your schema)
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
      });

      const savedInterview = await newInterview.save();

      // 4. Update Application Status
      // Use jobApplicationService.updateApplicationStatus as defined previously,
      // or ensure your updateApplication method can handle status-only updates.
      // Assuming you have a dedicated updateApplicationStatus or the general updateApplication handles it.
      await this.jobApplicationService.updateApplication(
        createInterviewDto.applicationId,
        { status: ApplicationStatus.INTERVIEW_SCHEDULED },
        createdBy // Pass who made the update
      );

      this.logger.log(`Interview scheduled successfully for application ${savedInterview.application}`);
      return savedInterview;
    } catch (error) {
      // Log the error for debugging
      this.logger.error('Error creating interview:', error.stack);

      // Re-throw specific HTTP exceptions
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      // Catch any other unexpected errors
      throw new InternalServerErrorException('Could not create interview due to an internal server error.');
    }
  }

  /**
   * Retrieves a single interview by its ID.
   * @param id The ID of the interview.
   * @returns The interview document.
   */
  async getInterviewById(id: string): Promise<IInterviewDocument> {
    try {
      
      const interview = await this.interviewModel
        .findById(id)
        .populate('application', 'candidateName candidateEmail status')
        .populate('jobPosition', 'title department')
        .exec();
      if (!interview) {
        throw new NotFoundException();
      }
      
      return interview;
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not retrieve interview due to an internal error.');
    }
  }

  /**
   * Retrieves interviews with pagination, filtering, and search.
   * @param queryDto Query parameters for filtering and pagination.
   * @returns Paginated list of interviews.
   */
  async getInterviews(queryDto: InterviewQueryDto): Promise<IPaginatedResponse<IInterviewDocument>> {
    try {
      

      const {
        page = 1,
        limit = 10,
        sortBy = 'scheduledDate',
        sortOrder = 'desc',
        applicationId,
        jobPositionId,
        interviewerId,
        type,
        status,
        scheduledDateFrom,
        scheduledDateTo,
        search,
      } = queryDto;

      const filter: FilterQuery<IInterviewDocument> = { isDeleted: false };

      if (applicationId) filter.application = new Types.ObjectId(applicationId);
      if (jobPositionId) filter.jobPosition = new Types.ObjectId(jobPositionId);
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (interviewerId) filter['interviewers.userId'] = new Types.ObjectId(interviewerId);

if (scheduledDateFrom || scheduledDateTo) {
  filter.scheduledDate = {}; // Initialize scheduledDate as an object for range queries
  if (scheduledDateFrom) {
    // Use $gte for "greater than or equal to" for the start date
    (filter.scheduledDate as any).$gte = new Date(scheduledDateFrom);
  }
  if (scheduledDateTo) {
    // Use $lte for "less than or equal to" for the end date
    const endOfDay = new Date(scheduledDateTo);
    endOfDay.setUTCHours(23, 59, 59, 999); // Set to end of the day for inclusivity
    (filter.scheduledDate as any).$lte = endOfDay;
  }
}

if (search) {
  // Use $or to combine multiple search conditions (any of which can be true)
  // Use $regex for pattern matching and $options: 'i' for case-insensitivity
  filter.$or = [
    { notes: { $regex: search, $options: 'i' } },
    // For nested fields in an array, use dot notation ('array.field')
    { 'interviewers.name': { $regex: search, $options: 'i' } },
    { 'interviewers.email': { $regex: search, $options: 'i' } },
  ];
}

      const total = await this.interviewModel.countDocuments(filter);
      const interviews = await this.interviewModel
        .find(filter)
        .populate('application', 'candidateName candidateEmail status')
        .populate('jobPosition', 'title department')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      

      return {
       data: interviews,
    totalDocs: total, // Change 'total' to 'totalDocs' to match the interface
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total, // Add these for a complete IPaginatedResponse
    hasPrevPage: page > 1,  
      };
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      throw new InternalServerErrorException('Could not retrieve interviews due to an internal error.');
    }
  }

  /**
   * Updates an existing interview.
   * @param id The ID of the interview to update.
   * @param updateInterviewDto Data for updating the interview.
   * @param updatedBy Optional ID of the user updating the record.
   * @returns The updated interview document.
   */
  async updateInterview(
    id: string,
    updateInterviewDto: UpdateInterviewDto,
    updatedBy?: string
  ): Promise<IInterviewDocument> {
    try {
      

      const interview = await this.interviewModel.findById(id).exec();
      if (!interview) {
        throw new NotFoundException();
      }

      // If interviewers array is updated, ensure userId is still a valid ObjectId
      if (updateInterviewDto.interviewers) {
        const validatedInterviewers = updateInterviewDto.interviewers.map(interviewer => {
          if (interviewer.userId && !Types.ObjectId.isValid(interviewer.userId)) {
            throw new BadRequestException(`Invalid userId in interviewers array: ${interviewer.userId}`);
          }
          return {
            ...interviewer,
            userId: interviewer.userId ? new Types.ObjectId(interviewer.userId) : undefined,
          } as IInterviewer; // Cast to IInterviewer because 'feedback' and 'rating' are optional here but not in schema creation
        });
        interview.interviewers = validatedInterviewers;
        delete updateInterviewDto.interviewers; // Prevent Object.assign from overwriting
      }

      // Handle status transitions if needed
      if (updateInterviewDto.status && updateInterviewDto.status !== interview.status) {
        // Optionally add logic to update related application status here based on interview status
        // e.g., if interview status becomes 'Completed' and overallRating is good, update application to 'SCREENING' or 'HIRED'
      }

      Object.assign(interview, updateInterviewDto); // Apply remaining updates
      interview.updatedBy = updatedBy ? new Types.ObjectId(updatedBy) : undefined;

      const updatedInterview = await interview.save();
      
      return updatedInterview;
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not update interview due to an internal error.');
    }
  }

  /**
   * Soft deletes an interview by its ID.
   * @param id The ID of the interview to delete.
   * @param deletedBy Optional ID of the user deleting the record.
   */
  async deleteInterview(id: string, deletedBy?: string): Promise<void> {
    try {
      
      const result = await this.interviewModel.findByIdAndUpdate(
        id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : undefined,
          status: 'Cancelled' // Optionally set status to cancelled on soft delete
        },
        { new: true }
      ).exec();

      if (!result) {
        throw new NotFoundException();
      }
      
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not delete interview due to an internal error.');
    }
  }

  /**
   * Restores a soft-deleted interview by its ID.
   * @param id The ID of the interview to restore.
   * @param updatedBy Optional ID of the user restoring the record.
   * @returns The restored interview document.
   */
  async restoreInterview(id: string, updatedBy?: string): Promise<IInterviewDocument> {
    try {
      
      const restoredInterview = await this.interviewModel.findByIdAndUpdate(
        id,
        {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
          status: 'Scheduled' // Restore to scheduled or previous if tracked
        },
        { new: true }
      ).exec();

      if (!restoredInterview) {
        throw new NotFoundException();
      }
      
      return restoredInterview;
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not restore interview due to an internal error.');
    }
  }

   /**
   * Hard deletes an interview by its ID (for admin/testing purposes, bypasses soft delete).
   * @param id The ID of the interview to hard delete.
   */
  async hardDeleteInterview(id: string): Promise<void> {
    try {
    
      const result = await this.interviewModel.deleteOne({ _id: id }).exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException();
      }
    
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not hard delete interview due to an internal error.');
    }
  }
}
