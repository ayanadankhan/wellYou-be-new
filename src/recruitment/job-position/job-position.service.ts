// src/recruitment/job-position/job-position.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
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
    try {
      this.logger.log(`Attempting to create a new job position: ${createJobPositionDto.title}`);

      // Optional: Check for duplicate job titles if uniqueness is a business rule
      const existingJob = await this.jobPositionModel.findOne({
        title: createJobPositionDto.title,
        isDeleted: false,
      });
      if (existingJob) {
        throw new ConflictException('Job position with this title already exists.');
      }

      const newJobPosition = new this.jobPositionModel({
        ...createJobPositionDto,
        status: JobStatus.DRAFT, // Default status
        postedDate: new Date(),
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined, // Assign createdBy
      });
      const savedJob = await newJobPosition.save();
      this.logger.log(`Job position created successfully: ${savedJob._id}`);
      return savedJob;
    } catch (error) {
      this.logger.error('Error creating job position:', error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not create job position due to an internal error.');
    }
  }

  /**
   * Retrieves a single job position by its ID.
   * @param id The ID of the job position.
   * @returns The job position document.
   */
  async getJobPositionById(id: string): Promise<IJobPositionDocument> {
    try {

      const jobPosition = await this.jobPositionModel.findById(id).exec();
      if (!jobPosition) {
        throw new NotFoundException();
      }

      return jobPosition;
    } catch (error) {
      this.logger.error('Error creating job position:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not retrieve job position due to an internal error.');
    }
  }

  /**
   * Retrieves job positions with pagination, filtering, and search.
   * @param queryDto Query parameters for filtering and pagination.
   * @returns Paginated list of job positions.
   */
  async getJobPositions(queryDto: JobPositionQueryDto): Promise<IPaginatedResponse<IJobPositionDocument>> {
    try {


      const {
        page = 1,
        limit = 10,
        sortBy = 'postedDate',
        sortOrder = 'desc',
        department,
        location,
        employmentType,
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
      if (employmentType) filter.employmentType = employmentType;
      if (status) filter.status = status;

      if (salaryMin !== undefined || salaryMax !== undefined) {
        // Filter for jobs where the job's minimum salary is <= the requested salaryMax
        // AND the job's maximum salary is >= the requested salaryMin

        if (salaryMin !== undefined) {
          // A job's salaryMax must be greater than or equal to the requested salaryMin
          filter.salaryMax = { ...filter.salaryMax, $gte: salaryMin };
        }
        if (salaryMax !== undefined) {
          // A job's salaryMin must be less than or equal to the requested salaryMax
          filter.salaryMin = { ...filter.salaryMin, $lte: salaryMax };
        }
      }
      // A more accurate salary range filter might involve checking salaryMin <= queryMax and salaryMax >= queryMin
      // For simplicity, current filter applies to salaryMin field.

      /* This code block is handling the filtering of job positions based on the posted date range. */
      if (postedDateFrom || postedDateTo) {
        filter.postedDate = {}; // Initialize postedDate as an object for range queries
        if (postedDateFrom) {
          (filter.postedDate as any).$gte = new Date(postedDateFrom); // Set 'greater than or equal to'
        }
        if (postedDateTo) {
          const endOfDay = new Date(postedDateTo);
          endOfDay.setUTCHours(23, 59, 59, 999); // Set to end of the day for inclusivity
          (filter.postedDate as any).$lte = endOfDay; // Set 'less than or equal to'
        }
      }

      if (search) {
        filter.$or = [ // <-- Missing '$or' key
          { title: { $regex: search, $options: 'i' } },       // <-- Missing '$regex' and '$options'
          { description: { $regex: search, $options: 'i' } }, // <-- Missing '$regex' and '$options'
          { department: { $regex: search, $options: 'i' } },  // <-- Missing '$regex' and '$options'
          { location: { $regex: search, $options: 'i' } },    // <-- Missing '$regex' and '$options'
          { 'responsibilities': { $regex: search, $options: 'i' } }, // <-- Missing '$regex' and '$options'
          { 'requirements': { $regex: search, $options: 'i' } },     // <-- Missing '$regex' and '$options'
        ];
      }

      const total = await this.jobPositionModel.countDocuments(filter);
      const jobPositions = await this.jobPositionModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();



      return {
        data: jobPositions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error creating job position:', error.stack);
      throw new InternalServerErrorException('Could not retrieve job positions due to an internal error.');
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
    try {


      // Optional: Check for duplicate job titles if uniqueness is a business rule and title is being updated
      if (updateJobPositionDto.title) {
        const existingJob = await this.jobPositionModel.findOne({
          title: updateJobPositionDto.title,
          _id: id, // Exclude current job from check
          isDeleted: false,
        });
        if (existingJob) {
          throw new ConflictException('Job position with this title already exists.');
        }
      }

      const updatedJobPosition = await this.jobPositionModel.findByIdAndUpdate(
        id,
        {
          ...updateJobPositionDto,
          updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined, // Assign updatedBy
        },
        { new: true } // Return the updated document
      ).exec();

      if (!updatedJobPosition) {
        throw new NotFoundException();
      }

      return updatedJobPosition;
    } catch (error) {
      this.logger.error('Error creating job position:', error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not update job position due to an internal error.');
    }
  }

  /**
   * Soft deletes a job position by its ID.
   * @param id The ID of the job position to delete.
   * @param deletedBy Optional ID of the user deleting the record.
   */
  async deleteJobPosition(id: string, deletedBy?: string): Promise<void> {
    try {

      const result = await this.jobPositionModel.findByIdAndUpdate(
        id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : undefined,
          status: JobStatus.CLOSED // Optionally set status to closed on soft delete
        },
        { new: true }
      ).exec();

      if (!result) {
        throw new NotFoundException();
      }

    } catch (error) {
      this.logger.error('Error creating job position:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not delete job position due to an internal error.');
    }
  }

  /**
   * Restores a soft-deleted job position by its ID.
   * @param id The ID of the job position to restore.
   * @param updatedBy Optional ID of the user restoring the record.
   * @returns The restored job position document.
   */
  async restoreJobPosition(id: string, updatedBy?: string): Promise<IJobPositionDocument> {
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
        throw new NotFoundException();
      }

      return restoredJobPosition;
    } catch (error) {
      this.logger.error('Error creating job position:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not restore job position due to an internal error.');
    }
  }

  /**
  * Hard deletes a job position by its ID (for admin/testing purposes, bypasses soft delete).
  * @param id The ID of the job position to hard delete.
  */
  async hardDeleteJobPosition(id: string): Promise<void> {
    try {

      const result = await this.jobPositionModel.deleteOne({ _id: id }).exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException();
      }

    } catch (error) {
      this.logger.error('Error creating job position:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not hard delete job position due to an internal error.');
    }
  }
}
