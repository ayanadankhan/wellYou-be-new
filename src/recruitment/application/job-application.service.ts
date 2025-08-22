// src/recruitment/application/job-application.service.ts
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
import { Application, IApplicationDocument } from './schemas/application.schema';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { IPaginatedResponse } from 'src/recruitment/shared/interfaces';
import { ApplicationStatus } from 'src/recruitment/shared/enums';
import { JobPositionService } from 'src/recruitment/job-position/job-position.service';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // For unique file names

// Ensure you have multer configured globally or per-route for file uploads
// This service only handles the logic after file is received.
// For a real app, integrate with a file storage service (S3, Azure Blob, local fs)

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads/resumes'); // Define your upload directory

  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<IApplicationDocument>,
    private readonly jobPositionService: JobPositionService,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
      
    }
  }

  /**
   * Creates a new job application.
   * @param createApplicationDto Data for creating the application.
  //  * @param resumeFile Buffer of the uploaded resume file.
   * @param createdBy Optional ID of the user creating the record.
   * @returns The created application document.
   */
 async createApplication(
    createApplicationDto: CreateApplicationDto,
    resumePathFromDto: string, // Now directly accepting the path from DTO
    createdBy?: string
  ): Promise<IApplicationDocument> {
    try {
      this.logger.log(`Attempting to create a new application for ${createApplicationDto.candidateEmail}`);

      // 1. Validate Job Position Exists AND IS ACTIVE
      const jobPosition = await this.jobPositionService.getJobPositionById(createApplicationDto.jobPositionId);
      if (!jobPosition || jobPosition.status !== 'ACTIVE') {
        const errorMessage = `Job position with ID "${createApplicationDto.jobPositionId}" not found or not active (current status: ${jobPosition?.status || 'N/A'}).`;
        this.logger.warn(errorMessage);
        throw new BadRequestException(errorMessage); // <--- ADD MESSAGE HERE
      }

      // 2. Prevent Duplicate Applications (same email + job position)
      const existingApplication = await this.applicationModel.findOne({
        jobPosition: new Types.ObjectId(createApplicationDto.jobPositionId),
        candidateEmail: createApplicationDto.candidateEmail,
        isDeleted: false,
      }).exec();

      if (existingApplication) {
        const errorMessage = `An application from "${createApplicationDto.candidateEmail}" for job "${jobPosition.title}" already exists.`;
        this.logger.warn(errorMessage);
        throw new ConflictException(errorMessage); // <--- ADD MESSAGE HERE
      }

      // ... (rest of your commented-out file handling logic)
      let finalResumePath: string = createApplicationDto.resumePath; // Use the path from DTO
      // ... (end of commented-out file handling)


      // 4. Create Application Record
      const newApplication = new this.applicationModel({
        ...createApplicationDto,
        jobPosition: new Types.ObjectId(createApplicationDto.jobPositionId),
        resumePath: finalResumePath, // This will be the string from the DTO
        status: ApplicationStatus.APPLIED,
        appliedDate: new Date(),
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
      });

      const savedApplication = await newApplication.save();
      this.logger.log(`Application created successfully: ${savedApplication._id}`);
      return savedApplication;
    } catch (error) {
      this.logger.error(`Error creating application: ${error.message}`, error.stack);
      // ... (rest of your error handling)
      if (error instanceof BadRequestException || error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not create application due to an internal error.');
    }
  }

  /**
   * Retrieves a single application by its ID.
   * @param id The ID of the application.
   * @returns The application document.
   */
  async getApplicationById(id: string): Promise<IApplicationDocument> {
    try {
      
      const application = await this.applicationModel.findById(id).populate('jobPosition', 'title department location').exec();
      if (!application) {
        throw new NotFoundException();
      }
      
      return application;
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not retrieve application due to an internal error.');
    }
  }

  /**
   * Retrieves applications with pagination, filtering, and search.
   * @param queryDto Query parameters for filtering and pagination.
   * @returns Paginated list of applications.
   */
  async getApplications(queryDto: ApplicationQueryDto): Promise<IPaginatedResponse<IApplicationDocument>> {
    try {
      

      const {
        page = 1,
        limit = 10,
        sortBy = 'appliedDate',
        sortOrder = 'desc',
        jobPositionId,
        status,
        candidateName,
        candidateEmail,
        skills,
        minExperience,
        educationLevel,
        search,
        appliedDateFrom,
        appliedDateTo,
      } = queryDto;

      const filter: FilterQuery<IApplicationDocument> = { isDeleted: false };

      if (jobPositionId) filter.jobPosition = new Types.ObjectId(jobPositionId);
      if (status) filter.status = status;
      if (candidateName) filter.candidateName = new RegExp(candidateName, 'i');
      if (candidateEmail) filter.candidateEmail = new RegExp(candidateEmail, 'i');
      if (educationLevel) filter.educationLevel = educationLevel;

      // Assuming 'filter' is an object that will be used for MongoDB queries

if (skills && skills.length > 0) {
  // To match documents where the 'skills' array contains ANY of the provided skills,
  // use the $in operator with an array of RegExp objects.
  filter.skills = { $in: skills.map(skill => new RegExp(skill, 'i')) };
}

if (minExperience !== undefined) {
  // To find documents where 'experienceYears' is greater than or equal to 'minExperience',
  // use the $gte operator.
  filter.experienceYears = { $gte: minExperience };
}

if (appliedDateFrom || appliedDateTo) {
  filter.appliedDate = {}; // Initialize as an object for range queries
  if (appliedDateFrom) {
    (filter.appliedDate as any).$gte = new Date(appliedDateFrom); // Greater than or equal to
  }
  if (appliedDateTo) {
    const endOfDay = new Date(appliedDateTo);
    endOfDay.setUTCHours(23, 59, 59, 999); // Set to end of the day for inclusivity
    (filter.appliedDate as any).$lte = endOfDay; // Less than or equal to
  }
}

if (search) {
  // To perform a multi-field text search, combine conditions using the $or operator,
  // and use $regex with $options: 'i' for case-insensitive matching.
  filter.$or = [ // <-- MongoDB $or operator
    { candidateName: { $regex: search, $options: 'i' } },
    { candidateEmail: { $regex: search, $options: 'i' } },
    { 'skills': { $regex: search, $options: 'i' } }, // If 'skills' is an array of strings, this will search within them
    { notes: { $regex: search, $options: 'i' } },
  ];
}

      const total = await this.applicationModel.countDocuments(filter);
      const applications = await this.applicationModel
        .find(filter)
        .populate('jobPosition', 'title department location') // Populate job position details
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      

      return {
        data: applications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      throw new InternalServerErrorException('Could not retrieve applications due to an internal error.');
    }
  }

  /**
   * Updates an existing application.
   * @param id The ID of the application to update.
   * @param updateApplicationDto Data for updating the application.
   * @param updatedBy Optional ID of the user updating the record.
   * @returns The updated application document.
   */
  async updateApplication(
    id: string,
    updateApplicationDto: UpdateApplicationDto,
    updatedBy?: string
  ): Promise<IApplicationDocument> {
    try {
      

      const application = await this.applicationModel.findById(id).exec();
      if (!application) {
        throw new NotFoundException();
      }

      // Handle status transitions and date updates
      if (updateApplicationDto.status && updateApplicationDto.status !== application.status) {
        const newStatus = updateApplicationDto.status;
        switch (newStatus) {
          case ApplicationStatus.SCREENING:
            application.screeningDate = new Date();
            break;
          case ApplicationStatus.INTERVIEW:
            application.interviewDate = new Date();
            break;
          case ApplicationStatus.HIRED:
            application.hireDate = new Date();
            application.rejectionDate = null; // Clear rejection info
            application.rejectionReason = null;
            break;
          case ApplicationStatus.REJECTED:
            application.rejectionDate = new Date();
            application.hireDate = null; // Clear hire info
            if (!updateApplicationDto.rejectionReason) {
              throw new BadRequestException('Rejection reason is required when setting status to REJECTED.');
            }
            break;
          default:
            // No specific date update for other status changes (e.g., APPLIED)
            break;
        }
      }

      // Apply other updates
      Object.assign(application, updateApplicationDto);
      application.updatedBy = updatedBy ? new Types.ObjectId(updatedBy) : undefined;

      const updatedApplication = await application.save();
      
      return updatedApplication;
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not update application due to an internal error.');
    }
  }

  /**
   * Soft deletes an application by its ID.
   * @param id The ID of the application to delete.
   * @param deletedBy Optional ID of the user deleting the record.
   */
  async deleteApplication(id: string, deletedBy?: string): Promise<void> {
    try {
      
      const result = await this.applicationModel.findByIdAndUpdate(
        id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : undefined,
          status: ApplicationStatus.REJECTED // Optionally set status to rejected on soft delete
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
      throw new InternalServerErrorException('Could not delete application due to an internal error.');
    }
  }

  /**
   * Restores a soft-deleted application by its ID.
   * @param id The ID of the application to restore.
   * @param updatedBy Optional ID of the user restoring the record.
   * @returns The restored application document.
   */
  async restoreApplication(id: string, updatedBy?: string): Promise<IApplicationDocument> {
    try {
      
      const restoredApplication = await this.applicationModel.findByIdAndUpdate(
        id,
        {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
          status: ApplicationStatus.APPLIED // Restore to initial status or previous status if tracked
        },
        { new: true }
      ).exec();

      if (!restoredApplication) {
        throw new NotFoundException();
      }
      
      return restoredApplication;
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not restore application due to an internal error.');
    }
  }

  /**
   * Hard deletes an application by its ID (for admin/testing purposes, bypasses soft delete).
   * Also deletes the associated resume file.
   * @param id The ID of the application to hard delete.
   */
  async hardDeleteApplication(id: string): Promise<void> {
    try {
     
      const application = await this.applicationModel.findById(id).exec();

      if (!application) {
        throw new NotFoundException();
      }

      // Delete associated resume file
      if (application.resumePath && fs.existsSync(application.resumePath)) {
        try {
          fs.unlinkSync(application.resumePath);
         
        } catch (fileDeleteError) {
          
          this.logger.error('Error deleting resume file:', fileDeleteError.stack);
          // Continue with DB deletion even if file deletion fails, but log it.
        }
      }

      const result = await this.applicationModel.deleteOne({ _id: id }).exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException();
      }
     
    } catch (error) {
      
      this.logger.error('Error creating application:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not hard delete application due to an internal error.');
    }
  }
}
