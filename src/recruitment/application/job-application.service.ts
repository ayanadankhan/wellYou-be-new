import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application } from './schemas/application.schema';
import { IApplicationDocument } from './interfaces/application.interface';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { CandidateProfileService } from '../candidate-profile/candidate-profile.service';
import { JobPostingService } from '../job-position/job-position.service';
import { IPaginatedResponse } from '../shared/interfaces';
import { ApplicationStatus } from '../shared/enums';
import { IJobPostingDocument } from '../job-position/interfaces/job-position.interface';
import { AiExtractionService } from '../job-position/ai-extraction.service';

@Injectable()
export class JobApplicationService {
  private readonly logger = new Logger(JobApplicationService.name);

  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<IApplicationDocument>,
    private readonly candidateProfileService: CandidateProfileService,
    private readonly jobPositionService: JobPostingService,
    private readonly aiExtractionService: AiExtractionService,
  ) {}

  async createApplication(createApplicationDto: CreateApplicationDto, createdBy?: string): Promise<IApplicationDocument> {
    const { jobPositionId, candidateProfileDetails, resumePath, ...applicationFields } = createApplicationDto;
    this.logger.log(`Received request to create a new application for job ID: ${jobPositionId}`);

    // 1. Validate Job Position existence
    this.logger.log(`Checking existence of Job Position ID: ${jobPositionId}`);
    const jobPosition: IJobPostingDocument | null = await this.jobPositionService.findOne(jobPositionId);
    if (!jobPosition) {
      throw new NotFoundException(`Job Position with ID '${jobPositionId}' not found.`);
    }
    this.logger.log(`Job Position '${jobPositionId}' found.`);

    // 2. Create a new Candidate Profile
    let candidateProfileId: Types.ObjectId;
    this.logger.log(`Attempting to create a new candidate profile.`);
    try {
      const newCandidateProfile = await this.candidateProfileService.create(candidateProfileDetails, createdBy);
      candidateProfileId = newCandidateProfile._id as Types.ObjectId;
      this.logger.log(`Successfully created new candidate profile with ID: ${candidateProfileId}`);
    } catch (error) {
      this.logger.error(`Failed to create candidate profile during application submission: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create candidate profile: ${error.message}`);
    }

    // 3. Check for duplicate application (optional, but good for data integrity)
    this.logger.log(`Checking for duplicate application for candidate ${candidateProfileId} and job ${jobPositionId}`);
    const existingApplication = await this.applicationModel.findOne({
      jobPosition: new Types.ObjectId(jobPositionId),
      candidateProfile: candidateProfileId,
      isDeleted: false,
    }).exec();

    if (existingApplication) {
      this.logger.warn(`Duplicate application detected for job '${jobPositionId}' by candidate '${candidateProfileId}'.`);
      throw new ConflictException('An application for this candidate to this job position already exists.');
    }
    this.logger.log(`No existing application found, proceeding with creation.`);


    // 4. Perform AI resume analysis and calculate match score
    let matchScore = 0;
    let extractedSkills: string[] = [];
    let resumeAnalysisDate: Date | null = null;
    let extractedSummary: string = "";

    try {
      this.logger.log(`Initiating AI resume analysis for resume path: ${resumePath}`);
      const extractedData = await this.aiExtractionService.extractResumeData(resumePath);
      
      this.logger.log(`AI extraction completed. Extracted skills count: ${extractedData.extractedSkills.length}. Extracted summary length: ${extractedData.summary.length}`);
      this.logger.log(`Extracted summary: ${extractedData.summary}`);
      this.logger.log(`Extracted skills: ${extractedData.extractedSkills.join(', ')}`);

      extractedSkills = extractedData.extractedSkills;
      extractedSummary = extractedData.summary;
      resumeAnalysisDate = new Date();

      this.logger.log(`Calculating match score...`);
      this.logger.log(`Candidate extracted skills: ${extractedSkills}`);
      
      matchScore = await this.aiExtractionService.calculateMatchScore(extractedData, jobPosition);
      
      this.logger.log(`Match score calculated: ${matchScore}`);
      
    } catch (error) {
      this.logger.error(`AI analysis failed: ${error.message}`, error.stack);
      // Don't throw the error, just proceed with default values to allow application creation
    }

    // Ensure matchScore is a valid number before saving to the database.
    const sanitizedMatchScore = isNaN(matchScore) ? 0 : matchScore;
    this.logger.log(`Sanitized match score to be saved: ${sanitizedMatchScore}`);

    // 5. Create the Application document
    const createdApplication = new this.applicationModel({
      ...applicationFields,
      jobPosition: new Types.ObjectId(jobPositionId),
      candidateProfile: candidateProfileId,
      appliedDate: new Date(),
      status: ApplicationStatus.APPLIED,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
      matchScore: sanitizedMatchScore, // Use the sanitized value here
      extractedSkills: extractedSkills,
      extractedSummary: extractedSummary,
      resumeAnalysisDate: resumeAnalysisDate,
      resumePath: resumePath, // Explicitly include the resumePath
    });
    this.logger.log(`Final application object constructed. Attempting to save...`);
    this.logger.log(`Application data to be saved: ${JSON.stringify({
      matchScore: createdApplication.matchScore,
      extractedSkills: createdApplication.extractedSkills,
      extractedSummary: createdApplication.extractedSummary,
      resumePath: createdApplication.resumePath
    })}`);

    try {
      const savedApplication = await createdApplication.save();
      this.logger.log(`Application created successfully with ID: ${savedApplication._id}`);
      return savedApplication;
    } catch (error) {
      this.logger.error(`Failed to save application: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to save application: ${error.message}`);
    }
  }

  async getApplicationById(id: string): Promise<IApplicationDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
    const application = await this.applicationModel
      .findById(id)
      .populate('candidateProfile')
      .populate('jobPosition')
      .exec();

    if (!application) {
      this.logger.warn(`Application with ID '${id}' not found.`);
      return null;
    }
    return application;
  }

  async getApplications(queryDto: ApplicationQueryDto): Promise<IPaginatedResponse<IApplicationDocument>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'appliedDate',
      sortOrder = 'desc',
      jobPositionId,
      status,
      candidateProfileFilters,
      applicationSkills,
      search,
      appliedDateFrom,
      appliedDateTo,
      source,
    } = queryDto;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [];
    const matchStage: any = { isDeleted: false };

    // Initial match for application-specific filters
    if (jobPositionId) {
      if (!Types.ObjectId.isValid(jobPositionId)) {
        throw new BadRequestException(`Invalid jobPositionId format: ${jobPositionId}`);
      }
      matchStage.jobPosition = new Types.ObjectId(jobPositionId);
    }
    if (status) {
      matchStage.status = status;
    }
    if (source) {
      matchStage.source = { $regex: source, $options: 'i' };
    }
    if (applicationSkills && applicationSkills.length > 0) {
      matchStage.skills = { $in: applicationSkills.map(skill => new RegExp(skill, 'i')) };
    }
    if (appliedDateFrom || appliedDateTo) {
      matchStage.appliedDate = {};
      if (appliedDateFrom) {
        matchStage.appliedDate.$gte = new Date(appliedDateFrom);
      }
      if (appliedDateTo) {
        matchStage.appliedDate.$lte = new Date(appliedDateTo);
      }
    }

    pipeline.push({ $match: matchStage });

    // Lookup and unwind CandidateProfile for filtering
    pipeline.push({
      $lookup: {
        from: 'candidate_profiles',
        localField: 'candidateProfile',
        foreignField: '_id',
        as: 'candidateProfile',
      },
    });
    pipeline.push({ $unwind: { path: '$candidateProfile', preserveNullAndEmptyArrays: false } });

    // Apply filters from candidateProfileFilters if present
    if (candidateProfileFilters) {
      const candidateMatch: any = {};
      if (candidateProfileFilters.candidateName) {
        candidateMatch['candidateProfile.candidateName'] = { $regex: candidateProfileFilters.candidateName, $options: 'i' };
      }
      if (candidateProfileFilters.candidateEmail) {
        candidateMatch['candidateProfile.candidateEmail'] = { $regex: candidateProfileFilters.candidateEmail, $options: 'i' };
      }
      if (candidateProfileFilters.candidatePhone) {
        candidateMatch['candidateProfile.candidatePhone'] = { $regex: candidateProfileFilters.candidatePhone, 'options': 'i' };
      }
      if (candidateProfileFilters.minExperience) {
        candidateMatch['candidateProfile.overallExperienceYears'] = { $gte: candidateProfileFilters.minExperience };
      }
      if (candidateProfileFilters.educationLevel) {
        candidateMatch['candidateProfile.education.level'] = candidateProfileFilters.educationLevel;
      }
      if (candidateProfileFilters.gender) {
        candidateMatch['candidateProfile.gender'] = candidateProfileFilters.gender;
      }
      if (candidateProfileFilters.location) {
        candidateMatch['candidateProfile.location'] = { $regex: candidateProfileFilters.location, $options: 'i' };
      }
      if (candidateProfileFilters.skills && candidateProfileFilters.skills.length > 0) {
        candidateMatch['candidateProfile.generalSkills'] = { $in: candidateProfileFilters.skills.map(s => new RegExp(s, 'i')) };
      }
      if (Object.keys(candidateMatch).length > 0) {
        pipeline.push({ $match: candidateMatch });
      }
    }

    // General search across application and candidate profile fields
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'notes': { $regex: search, $options: 'i' } },
            { 'source': { $regex: search, 'options': 'i' } },
            { 'skills': { $regex: search, 'options': 'i' } },
            { 'candidateProfile.candidateName': { $regex: search, 'options': 'i' } },
            { 'candidateProfile.candidateEmail': { $regex: search, 'options': 'i' } },
            { 'candidateProfile.candidatePhone': { $regex: search, 'options': 'i' } },
            { 'candidateProfile.generalSkills': { $regex: search, 'options': 'i' } },
          ],
        },
      });
    }

    // Pagination and Sorting
    pipeline.push({ $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } });
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'totalDocs' }, { $addFields: { page, limit, totalPages: { $ceil: { $divide: ['$totalDocs', limit] } } } }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    });

    const [result] = await this.applicationModel.aggregate(pipeline).exec();

    const metadata = result.metadata[0] || { totalDocs: 0, totalPages: 0 };
    const applications = result.data || [];

    return {
      data: applications,
      totalDocs: metadata.totalDocs,
      limit: metadata.limit,
      page: metadata.page,
      totalPages: metadata.totalPages,
      hasNextPage: page < metadata.totalPages,
      hasPrevPage: page > 1,
    };
  }

  async updateApplication(id: string, updateApplicationDto: UpdateApplicationDto, updatedBy?: string): Promise<IApplicationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }

    const application = await this.applicationModel.findById(id).exec();
    if (!application) {
      throw new NotFoundException(`Application with ID '${id}' not found.`);
    }

    if (updateApplicationDto.status && application.status !== updateApplicationDto.status) {
      if ([ApplicationStatus.REJECTED, ApplicationStatus.HIRED].includes(application.status)) {
        throw new BadRequestException(`Cannot change status from ${application.status}.`);
      }
      switch (updateApplicationDto.status) {
        case ApplicationStatus.SCREENED:
          updateApplicationDto.screeningDate = new Date();
          break;
        case ApplicationStatus.REJECTED:
          updateApplicationDto.rejectionDate = new Date();
          break;
        case ApplicationStatus.HIRED:
          updateApplicationDto.hireDate = new Date();
          break;
      }
    }

    const updatedApplication = await this.applicationModel.findByIdAndUpdate(
      id,
      {
        ...updateApplicationDto,
        updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
      },
      { new: true }
    ).exec();

    if (!updatedApplication) {
      throw new NotFoundException(`Application with ID '${id}' not found.`);
    }
    this.logger.log(`Application with ID '${id}' updated successfully.`);
    return updatedApplication;
  }

  async removeApplication(id: string, deletedBy?: string): Promise<IApplicationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
    const result = await this.applicationModel.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : undefined } },
      { new: true }
    ).exec();
    if (!result) {
      throw new NotFoundException(`Application with ID '${id}' not found.`);
    }
    this.logger.log(`Application with ID '${id}' soft-deleted successfully.`);
    return result;
  }
}
