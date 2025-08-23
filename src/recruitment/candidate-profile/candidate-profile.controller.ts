// src/recruitment/candidate-profile/candidate-profile.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  UsePipes,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CandidateProfileService } from './candidate-profile.service';
import { CreateCandidateProfileDto } from './dto/create-candidate-profile.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CandidateProfileQueryDto } from './dto/candidate-profile-query.dto'; // Assuming this DTO exists
import { ICandidateProfileDocument } from './interfaces/candidate-profile.interface';
import { IPaginatedResponse } from '../shared/interfaces'; // Assuming shared interfaces

@ApiTags('Candidate Profiles')
@Controller('candidate-profiles')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CandidateProfileController {
  private readonly logger = new Logger(CandidateProfileController.name);

  constructor(private readonly candidateProfileService: CandidateProfileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new candidate profile' })
  @ApiResponse({ status: 201, description: 'Candidate profile successfully created.', type: 'object' /* Specific DTO if needed */ })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation error or invalid data).' })
  @ApiResponse({ status: 409, description: 'Conflict (Profile with same email/phone already exists).' })
  async create(
    @Body() createCandidateProfileDto: CreateCandidateProfileDto,
    @Request() req: Request, // For createdBy field
  ): Promise<ICandidateProfileDocument> {
    this.logger.log(`Received request to create candidate profile for email: ${createCandidateProfileDto.candidateEmail}`);
    const createdBy = (req as any).user ? (req as any).user.id : undefined; // Assuming user ID from auth
    return this.candidateProfileService.create(createCandidateProfileDto, createdBy);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a candidate profile by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the candidate profile', type: String })
  @ApiResponse({ status: 200, description: 'The candidate profile found.', type: 'object' })
  @ApiResponse({ status: 400, description: 'Bad Request (Invalid ID format).' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async findOne(@Param('id') id: string): Promise<ICandidateProfileDocument> {
    this.logger.log(`Fetching candidate profile with ID: ${id}`);
    const profile = await this.candidateProfileService.findOne(id);
    if (!profile) {
      throw new NotFoundException(`Candidate profile with ID ${id} not found.`);
    }
    return profile;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all candidate profiles with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'General keyword search across name, email, skills, etc.' })
  @ApiQuery({ name: 'candidateName', required: false, type: String })
  @ApiQuery({ name: 'candidateEmail', required: false, type: String })
  @ApiQuery({ name: 'candidatePhone', required: false, type: String })
  @ApiQuery({ name: 'overallExperienceYears', required: false, type: Number })
  // @ApiQuery({ name: 'educationLevel', required: false, enum: Object.values(EducationLevel) })
  // @ApiQuery({ name: 'gender', required: false, enum: Object.values(Gender) })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'source', required: false, type: String })
  @ApiQuery({ name: 'generalSkills', required: false, type: [String], isArray: true, description: 'Comma-separated list of skills' })
  @ApiResponse({ status: 200, description: 'A paginated list of candidate profiles.', type: 'object' /* Adjust to reflect IPaginatedResponse with ICandidateProfileDocument */ })
  async findAll(@Query() queryDto: CandidateProfileQueryDto): Promise<IPaginatedResponse<ICandidateProfileDocument>> {
    this.logger.log('Received request to get all candidate profiles with filters.');
    return this.candidateProfileService.getCandidateProfiles(queryDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a candidate profile by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the candidate profile', type: String })
  @ApiBody({ type: UpdateCandidateProfileDto, description: 'Partial data for updating a candidate profile' })
  @ApiResponse({ status: 200, description: 'The candidate profile has been successfully updated.', type: 'object' })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation error or invalid ID/data).' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiResponse({ status: 409, description: 'Conflict (Email/phone already in use).' })
  async update(
    @Param('id') id: string,
    @Body() updateCandidateProfileDto: UpdateCandidateProfileDto,
    @Request() req: Request,
  ): Promise<ICandidateProfileDocument> {
    this.logger.log(`Received request to update candidate profile with ID: ${id}`);
    const updatedBy = (req as any).user ? (req as any).user.id : undefined; // Assuming user ID from auth
    return this.candidateProfileService.update(id, updateCandidateProfileDto, updatedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Use 204 for successful deletion with no content
  @ApiOperation({ summary: 'Soft delete a candidate profile by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the candidate profile', type: String })
  @ApiResponse({ status: 204, description: 'Candidate profile successfully soft-deleted.' })
  @ApiResponse({ status: 400, description: 'Bad Request (Invalid ID format).' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async remove(
    @Param('id') id: string,
    @Request() req: Request,
  ): Promise<void> {
    this.logger.log(`Received request to soft delete candidate profile with ID: ${id}`);
    const deletedBy = (req as any).user ? (req as any).user.id : undefined; // Assuming user ID from auth
    await this.candidateProfileService.remove(id, deletedBy);
  }
}