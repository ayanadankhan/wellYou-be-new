// src/recruitment/job-position/job-position.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { JobPosition, IJobPositionDocument } from './schemas/job-position.schema';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionQueryDto } from './dto/job-position-query.dto';
import { IPaginatedResponse } from 'src/recruitment/shared/interfaces';
import { JobStatus } from 'src/recruitment/shared/enums';

@Injectable()
export class JobPositionService {
  private readonly logger = new Logger(JobPositionService.name);

  constructor(
    @InjectModel(JobPosition.name) private readonly jobPositionModel: Model<IJobPositionDocument>,
  ) { }

  /**
   * Creates a new job position.
   * @param createJobPositionDto Data for creating the job position.
   * @param createdBy Optional ID of the user creating the record.
   * @returns The created job position document.
   */
  async createJobPosition(
    createJobPositionDto: CreateJobPositionDto,
    createdBy?: string
  ): Promise<IJobPositionDocument> {
    this.logger.log(`Attempting to create a new job position: ${createJobPositionDto.title}`);

    // Optional: Check for duplicate job titles if uniqueness is a business rule
    // This check should ideally be an index on title with unique: true, but manual check is also valid.
    const existingJob = await this.jobPositionModel.findOne({
      title: createJobPositionDto.title,
      isDeleted: false,
    }).exec(); // Added .exec() for consistency
    if (existingJob) {
      throw new ConflictException('Job position with this title already exists.');
    }

    try {
      const newJobPosition = new this.jobPositionModel({
        ...createJobPositionDto,
        status: JobStatus.DRAFT, // Default status
        postedDate: new Date(), // Automatically set postedDate
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined, // Assign createdBy
      });
      const savedJob = await newJobPosition.save();
      this.logger.log(`Job position created successfully with ID: ${savedJob._id}`);
      return savedJob;
    } catch (error) {
      // Catch specific Mongoose validation errors or other save-related issues
      this.logger.error(`Error saving new job position: ${error.message}`, error.stack);
      // If it's a Mongoose validation error, it often manifests as a BadRequest
      if (error.name === 'ValidationError' || error.name === 'MongoServerError' && error.code === 11000) {
        throw new BadRequestException(`Invalid job position data: ${error.message}`);
      }
      throw new InternalServerErrorException('Could not create job position due to an unexpected internal error.');
    }
  }

  /**
   * Retrieves a single job position by its ID.
   * @param id The ID of the job position.
   * @returns The job position document.
   */
  async getJobPositionById(id: string): Promise<IJobPositionDocument> {
    this.logger.log(`Attempting to retrieve job position by ID: ${id}`);
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }

    try {
      const jobPosition = await this.jobPositionModel.findById(id).exec();
      if (!jobPosition || jobPosition.isDeleted) { // Also consider isDeleted for hard deletion scenario or soft-deleted items
        throw new NotFoundException(`Job Position with ID '${id}' not found.`);
      }
      this.logger.log(`Job position retrieved successfully: ${jobPosition._id}`);
      return jobPosition;
    } catch (error) {
      this.logger.error(`Error retrieving job position by ID ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error; // Re-throw specific, anticipated errors
      }
      throw new InternalServerErrorException('Could not retrieve job position due to an unexpected internal error.');
    }
  }

  /**
   * Retrieves job positions with pagination, filtering, and search.
   * @param queryDto Query parameters for filtering and pagination.
   * @returns Paginated list of job positions.
   */
  async getJobPositions(queryDto: JobPositionQueryDto): Promise<IPaginatedResponse<IJobPositionDocument>> {
    this.logger.log('Attempting to retrieve job positions with query parameters.');

    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'postedDate',
        sortOrder = 'desc',
        department,
        location,
        jobType, // Changed from employmentType to jobType
        experienceLevel, // Added experienceLevel
        salaryMin,
        salaryMax,
        status,
        search,
        postedDateFrom,
        postedDateTo,
      } = queryDto;

      const filter: FilterQuery<IJobPositionDocument> = { isDeleted: false };

      if (department) filter.department = new RegExp(department, 'i');
      if (location) filter.location = new RegExp(location, 'i');
      if (jobType) filter.jobType = jobType; // Use jobType
      if (experienceLevel) filter.experienceLevel = experienceLevel; // Use experienceLevel
      if (status) filter.status = status;

      if (salaryMin !== undefined || salaryMax !== undefined) {
        filter.salaryRange = {}; // Initialize salaryRange for nested queries
        if (salaryMin !== undefined) {
          // A job's salaryMax must be greater than or equal to the requested salaryMin
          (filter.salaryRange as any).max = { $gte: salaryMin };
        }
        if (salaryMax !== undefined) {
          // A job's salaryMin must be less than or equal to the requested salaryMax
          (filter.salaryRange as any).min = { $lte: salaryMax };
        }
      }

      if (postedDateFrom || postedDateTo) {
        filter.postedDate = {};
        if (postedDateFrom) {
          (filter.postedDate as any).$gte = new Date(postedDateFrom);
        }
        if (postedDateTo) {
          const endOfDay = new Date(postedDateTo);
          endOfDay.setUTCHours(23, 59, 59, 999);
          (filter.postedDate as any).$lte = endOfDay;
        }
      }

      // ✨ CORRECTED: Search filter logic using $or with $regex
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { 'responsibilities': { $regex: search, $options: 'i' } }, // Match within array of strings
          { 'requirements': { $regex: search, $options: 'i' } }, // Match within array of strings
        ];
      }

      const total = await this.jobPositionModel.countDocuments(filter).exec();
      const jobPositions = await this.jobPositionModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      this.logger.log(`Retrieved ${jobPositions.length} job positions (total: ${total}).`);
      return {
        data: jobPositions,
        totalDocs: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      this.logger.error(`Error retrieving job positions: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not retrieve job positions due to an unexpected internal error.');
    }
  }

  /**
   * Updates an existing job position.
   * @param id The ID of the job position to update.
   * @param updateJobPositionDto Data for updating the job position.
   * @param updatedBy Optional ID of the user updating the record.
   * @returns The updated job position document.
   */
  async updateJobPosition(
    id: string,
    updateJobPositionDto: UpdateJobPositionDto,
    updatedBy?: string
  ): Promise<IJobPositionDocument> {
    this.logger.log(`Attempting to update job position with ID: ${id}`);
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }

    // Optional: Check for duplicate job titles if uniqueness is a business rule and title is being updated
    if (updateJobPositionDto.title) {
      const existingJob = await this.jobPositionModel.findOne({
        title: updateJobPositionDto.title,
        _id: { $ne: new Types.ObjectId(id) }, // Exclude current job from check
        isDeleted: false,
      }).exec();
      if (existingJob) {
        throw new ConflictException('Job position with this title already exists.');
      }
    }

    try {
      const updatedJobPosition = await this.jobPositionModel.findByIdAndUpdate(
        id,
        {
          ...updateJobPositionDto,
          updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined, // Assign updatedBy
        },
        { new: true } // Return the updated document
      ).exec();

      if (!updatedJobPosition || updatedJobPosition.isDeleted) { // Also check if it was found but deleted
        throw new NotFoundException(`Job Position with ID '${id}' not found.`);
      }

      this.logger.log(`Job position updated successfully: ${updatedJobPosition._id}`);
      return updatedJobPosition;
    } catch (error) {
      this.logger.error(`Error updating job position with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not update job position due to an unexpected internal error.');
    }
  }

  /**
   * Soft deletes a job position by its ID.
   * @param id The ID of the job position to delete.
   * @param deletedBy Optional ID of the user deleting the record.
   */
  async deleteJobPosition(id: string, deletedBy?: string): Promise<void> {
    this.logger.log(`Attempting to soft delete job position with ID: ${id}`);
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }

    try {
      const result = await this.jobPositionModel.findByIdAndUpdate(
        id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : null, // Use null if no deletedBy
          status: JobStatus.CLOSED // Optionally set status to closed on soft delete
        },
        { new: true }
      ).exec();

      if (!result) {
        throw new NotFoundException(`Job Position with ID '${id}' not found for soft delete.`);
      }
      this.logger.log(`Job position soft deleted successfully: ${result._id}`);
    } catch (error) {
      this.logger.error(`Error soft deleting job position with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not soft delete job position due to an unexpected internal error.');
    }
  }

  /**
   * Restores a soft-deleted job position by its ID.
   * @param id The ID of the job position to restore.
   * @param updatedBy Optional ID of the user restoring the record.
   * @returns The restored job position document.
   */
  async restoreJobPosition(id: string, updatedBy?: string): Promise<IJobPositionDocument> {
    this.logger.log(`Attempting to restore job position with ID: ${id}`);
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }

    try {
      const restoredJobPosition = await this.jobPositionModel.findByIdAndUpdate(
        id,
        {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
          status: JobStatus.DRAFT // Restore to DRAFT or previous status if tracked
        },
        { new: true }
      ).exec();

      if (!restoredJobPosition) {
        throw new NotFoundException(`Job Position with ID '${id}' not found for restore.`);
      }
      this.logger.log(`Job position restored successfully: ${restoredJobPosition._id}`);
      return restoredJobPosition;
    } catch (error) {
      this.logger.error(`Error restoring job position with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not restore job position due to an unexpected internal error.');
    }
  }

  /**
   * Hard deletes a job position by its ID (for admin/testing purposes, bypasses soft delete).
   * @param id The ID of the job position to hard delete.
   */
  async hardDeleteJobPosition(id: string): Promise<void> {
    this.logger.log(`Attempting to hard delete job position with ID: ${id}`);
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }

    try {
      const result = await this.jobPositionModel.deleteOne({ _id: new Types.ObjectId(id) }).exec(); // Ensure ObjectId for deletion
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Job Position with ID '${id}' not found for hard delete.`);
      }
      this.logger.log(`Job position hard deleted successfully for ID: ${id}`);
    } catch (error) {
      this.logger.error(`Error hard deleting job position with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not hard delete job position due to an unexpected internal error.');
    }
  }
}