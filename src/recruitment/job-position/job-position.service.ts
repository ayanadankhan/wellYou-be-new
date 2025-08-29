// src/recruitment/job-position/job-position.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { JobPosition, IJobPositionDocument } from './schemas/job-position.schema';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionQueryDto } from './dto/job-position-query.dto';
import { IPaginatedResponse } from 'src/recruitment/shared/interfaces';
import { JobStatus } from 'src/recruitment/shared/enums';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';
import { GetJobPositionDto } from './dto/get-job-position.dto';

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
    user: AuthenticatedUser,
    createdBy?: string
  ): Promise<IJobPositionDocument> {
    this.logger.log(`Attempting to create a new job position: ${createJobPositionDto.title}`);
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
        tenantId: new Types.ObjectId(user.tenantId),
        department: new Types.ObjectId(createJobPositionDto.department),
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

  async getJobPositions(getDto: GetJobPositionDto, user: AuthenticatedUser) {
  try {
    const pipeline: any[] = [];

    if (user?.tenantId) {
      pipeline.push({ $match: { tenantId: new Types.ObjectId(user.tenantId) } });
    }

    if (getDto.title) {
      pipeline.push({ $match: { title: new RegExp(getDto.title, 'i') } });
    }

      if (getDto.jobType) {
      pipeline.push({ $match: { jobType: new RegExp(getDto.jobType, 'i') } });
    }

    if (getDto.experienceLevel) {
      pipeline.push({ $match: { experienceLevel: new RegExp(getDto.experienceLevel, 'i') } });
    }

    // if (getDto.department) {
    //   if (!Types.ObjectId.isValid(getDto.department)) {
    //     throw new BadRequestException("Invalid departmentId");
    //   }
    //   pipeline.push({ $match: { department: new Types.ObjectId(getDto.department) } });
    // }
     if (getDto.department) {
      pipeline.push({
        $match: { department: new Types.ObjectId(getDto.department) },
      });
    }

    // 👇 Department object ko include karne k liye lookup
    pipeline.push(
      {
        $lookup: {
          from: 'departments', // Department collection ka naam
          localField: 'department', // jobPosition.department
          foreignField: '_id', // departments._id
          as: 'department',
        },
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true, // agar department missing ho to null return karega
        },
      }
    );

    const [list, countQuery] = await Promise.all([
      this.jobPositionModel.aggregate([
        ...pipeline,
        { $sort: { [getDto.sb || 'createdAt']: getDto.sd === '1' ? 1 : -1 } },
        { $skip: Number(getDto.o || 0) },
        { $limit: Number(getDto.l || 10) },
      ]).exec(),

      this.jobPositionModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
    ]);

    return {
      count: countQuery[0]?.total || 0,
      list: list || [],
    };
  } catch (error) {
    throw new HttpException(
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Failed to fetch job positions',
        message: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}


  async updateJobPosition(
    id: string,
    updateJobPositionDto: CreateJobPositionDto,
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
  // async hardDeleteJobPosition(id: string): Promise<void> {
  //   this.logger.log(`Attempting to hard delete job position with ID: ${id}`);
  //   if (!Types.ObjectId.isValid(id)) {
  //     throw new BadRequestException(`Invalid ID format: ${id}`);
  //   }

  //   try {
  //     const result = await this.jobPositionModel.deleteOne({ _id: new Types.ObjectId(id) }).exec(); // Ensure ObjectId for deletion
  //     if (result.deletedCount === 0) {
  //       throw new NotFoundException(`Job Position with ID '${id}' not found for hard delete.`);
  //     }
  //     this.logger.log(`Job position hard deleted successfully for ID: ${id}`);
  //   } catch (error) {
  //     this.logger.error(`Error hard deleting job position with ID ${id}: ${error.message}`, error.stack);
  //     if (error instanceof NotFoundException || error instanceof BadRequestException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException('Could not hard delete job position due to an unexpected internal error.');
  //   }
  // }
   async remove(id: string): Promise<void> {
    const result = await this.jobPositionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
  }
}