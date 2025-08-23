// src/recruitment/candidate-profile/candidate-profile.service.ts

import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CandidateProfile } from './entities/candidate-profile.entity';
import { ICandidateProfileDocument } from './interfaces/candidate-profile.interface';
import { CreateCandidateProfileDto } from './dto/create-candidate-profile.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CandidateProfileQueryDto } from './dto/candidate-profile-query.dto'; // Assuming you have this for searching
import { IPaginatedResponse } from '../shared/interfaces';

@Injectable()
export class CandidateProfileService {
  private readonly logger = new Logger(CandidateProfileService.name);

  constructor(
    @InjectModel(CandidateProfile.name) private readonly candidateProfileModel: Model<ICandidateProfileDocument>,
  ) {}

  async create(createCandidateProfileDto: CreateCandidateProfileDto, createdBy?: string): Promise<ICandidateProfileDocument> {
    this.logger.log(`Attempting to create candidate profile for email: ${createCandidateProfileDto.candidateEmail}`);

    // Check for existing profile by email
    const existingByEmail = await this.candidateProfileModel.findOne({ candidateEmail: createCandidateProfileDto.candidateEmail }).exec();
    if (existingByEmail) {
      throw new ConflictException(`Candidate profile with email '${createCandidateProfileDto.candidateEmail}' already exists.`);
    }

    // Check for existing profile by phone if provided
    if (createCandidateProfileDto.candidatePhone) {
      const existingByPhone = await this.candidateProfileModel.findOne({ candidatePhone: createCandidateProfileDto.candidatePhone }).exec();
      if (existingByPhone) {
        throw new ConflictException(`Candidate profile with phone number '${createCandidateProfileDto.candidatePhone}' already exists.`);
      }
    }

    const createdProfile = new this.candidateProfileModel({
      ...createCandidateProfileDto,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    });

    try {
      const savedProfile = await createdProfile.save();
      this.logger.log(`Candidate profile created successfully with ID: ${savedProfile._id}`);
      return savedProfile;
    } catch (error) {
      this.logger.error(`Failed to save candidate profile: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create candidate profile: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<ICandidateProfileDocument | null> {
    return this.candidateProfileModel.findOne({ candidateEmail: email }).exec();
  }

  async findByPhone(phone: string): Promise<ICandidateProfileDocument | null> {
    return this.candidateProfileModel.findOne({ candidatePhone: phone }).exec();
  }

  async findOne(id: string): Promise<ICandidateProfileDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
    const profile = await this.candidateProfileModel.findById(id).exec();
    if (!profile) {
      this.logger.warn(`Candidate profile with ID ${id} not found.`);
      return null;
    }
    return profile;
  }

  async update(id: string, updateCandidateProfileDto: UpdateCandidateProfileDto, updatedBy?: string): Promise<ICandidateProfileDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }

    // Check for email/phone conflicts if they are being updated
    if (updateCandidateProfileDto.candidateEmail) {
      const existing = await this.candidateProfileModel.findOne({ candidateEmail: updateCandidateProfileDto.candidateEmail, _id: { $ne: id } }).exec();
      if (existing) {
        throw new ConflictException(`Email '${updateCandidateProfileDto.candidateEmail}' is already used by another candidate profile.`);
      }
    }
    if (updateCandidateProfileDto.candidatePhone) {
      const existing = await this.candidateProfileModel.findOne({ candidatePhone: updateCandidateProfileDto.candidatePhone, _id: { $ne: id } }).exec();
      if (existing) {
        throw new ConflictException(`Phone number '${updateCandidateProfileDto.candidatePhone}' is already used by another candidate profile.`);
      }
    }

    const updatedProfile = await this.candidateProfileModel.findByIdAndUpdate(
      id,
      {
        ...updateCandidateProfileDto,
        updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
      },
      { new: true }
    ).exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Candidate profile with ID ${id} not found.`);
    }
    this.logger.log(`Candidate profile with ID ${id} updated successfully.`);
    return updatedProfile;
  }

  async remove(id: string, deletedBy?: string): Promise<ICandidateProfileDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
    const result = await this.candidateProfileModel.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : undefined } },
      { new: true }
    ).exec();
    if (!result) {
      throw new NotFoundException(`Candidate profile with ID ${id} not found.`);
    }
    this.logger.log(`Candidate profile with ID ${id} soft-deleted successfully.`);
    return result;
  }

  // You would also implement a method for paginated search:
  async getCandidateProfiles(queryDto: CandidateProfileQueryDto): Promise<IPaginatedResponse<ICandidateProfileDocument>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, ...filters } = queryDto;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [];
    const match: any = { isDeleted: false };

    // Apply filters from queryDto
    if (filters.candidateName) {
      match.candidateName = { $regex: filters.candidateName, $options: 'i' };
    }
    if (filters.candidateEmail) {
      match.candidateEmail = { $regex: filters.candidateEmail, $options: 'i' };
    }
    if (filters.candidatePhone) {
      match.candidatePhone = { $regex: filters.candidatePhone, $options: 'i' };
    }
    if (filters.overallExperienceYears) {
      match.overallExperienceYears = { $gte: filters.overallExperienceYears };
    }
    if (filters.educationLevel) {
      match['education.level'] = filters.educationLevel;
    }
    if (filters.gender) {
      match.gender = filters.gender;
    }
    if (filters.location) {
      match.location = { $regex: filters.location, $options: 'i' };
    }
    if (filters.source) {
      match.source = { $regex: filters.source, $options: 'i' };
    }

    // Handle array filters for skills
    if (filters.generalSkills && filters.generalSkills.length > 0) {
      match.generalSkills = { $in: filters.generalSkills.map(skill => new RegExp(skill, 'i')) };
    }

    // General search across relevant text fields
    if (search) {
      match.$or = [
        { candidateName: { $regex: search, $options: 'i' } },
        { candidateEmail: { $regex: search, $options: 'i' } },
        { candidatePhone: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
        { generalSkills: { $regex: search, $options: 'i' } }, // Searches for skills in the array
        { 'education.degree': { $regex: search, $options: 'i' } },
        { 'education.institution': { $regex: search, $options: 'i' } },
        { 'experiences.jobTitle': { $regex: search, $options: 'i' } },
        { 'experiences.company': { $regex: search, $options: 'i' } },
      ];
    }

    pipeline.push({ $match: match });

    const [totalDocs, profiles] = await Promise.all([
      this.candidateProfileModel.countDocuments(match),
      this.candidateProfileModel
        .find(match)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page * limit < totalDocs;
    const hasPrevPage = page > 1;

    return {
      data: profiles,
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }
}