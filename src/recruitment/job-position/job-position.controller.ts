// src/recruitment/job-position/job-position.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JobPositionService } from './job-position.service';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { JobPositionQueryDto } from './dto/job-position-query.dto';
import { IJobPositionDocument } from './interfaces/job-position.interface';
import { IPaginatedResponse } from 'src/recruitment/shared/interfaces';
import { JobStatus } from '../shared/enums';

@ApiTags('Job Positions')
@Controller('job-positions')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true })) // Enable validation and transformation globally for this controller
export class JobPositionController {
  private readonly logger = new Logger(JobPositionController.name);

  constructor(private readonly jobPositionService: JobPositionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new job position' })
  @ApiResponse({ status: 201, description: 'The job position has been successfully created.', type: CreateJobPositionDto })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation Error)' })
  @ApiResponse({ status: 409, description: 'Conflict (Job position with this title already exists)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async create(
    @Body() createJobPositionDto: CreateJobPositionDto,
    // @Request() req // Uncomment and use for getting user ID for createdBy
  ): Promise<IJobPositionDocument> {
    this.logger.log('Received request to create job position.');
    // In a real app, get user ID from request (e.g., req.user.id)
    return this.jobPositionService.createJobPosition(createJobPositionDto /*, req.user.id*/);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a job position by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the job position', type: String })
  @ApiResponse({ status: 200, description: 'The job position found.', type: CreateJobPositionDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async findOne(@Param('id') id: string): Promise<IJobPositionDocument> {
  
    return this.jobPositionService.getJobPositionById(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all job positions with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'department', required: false, type: String })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'employmentType', required: false, enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'] })
  @ApiQuery({ name: 'salaryMin', required: false, type: Number })
  @ApiQuery({ name: 'salaryMax', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'General keyword search' })
  @ApiQuery({ name: 'postedDateFrom', required: false, type: String,  description: 'Filter by minimum posted date (ISO string)' })
  @ApiQuery({ name: 'postedDateTo', required: false, type: String,  description: 'Filter by maximum posted date (ISO string)' })
  @ApiResponse({ status: 200, description: 'A paginated list of job positions.', type: [CreateJobPositionDto] })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async findAll(@Query() queryDto: JobPositionQueryDto): Promise<IPaginatedResponse<IJobPositionDocument>> {
    this.logger.log('Received request to get all job positions with filters.');
    return this.jobPositionService.getJobPositions(queryDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a job position by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the job position', type: String })
  @ApiResponse({ status: 200, description: 'The job position has been successfully updated.', type: UpdateJobPositionDto })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation Error)' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 409, description: 'Conflict (Job position with this title already exists)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async update(
    @Param('id') id: string,
    @Body() updateJobPositionDto: UpdateJobPositionDto,
    // @Request() req // Uncomment and use for getting user ID for updatedBy
  ): Promise<IJobPositionDocument> {
    
    // In a real app, get user ID from request (e.g., req.user.id)
    return this.jobPositionService.updateJobPosition(id, updateJobPositionDto /*, req.user.id*/);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content for successful deletion
  @ApiOperation({ summary: 'Soft delete a job position by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the job position', type: String })
  @ApiResponse({ status: 204, description: 'The job position has been successfully soft-deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async remove(
    @Param('id') id: string,
    // @Request() req // Uncomment and use for getting user ID for deletedBy
  ): Promise<void> {
    
    // In a real app, get user ID from request (e.g., req.user.id)
    await this.jobPositionService.deleteJobPosition(id /*, req.user.id*/);
  }

  @Put(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted job position by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the job position to restore', type: String })
  @ApiResponse({ status: 200, description: 'The job position has been successfully restored.', type: CreateJobPositionDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async restore(
    @Param('id') id: string,
    // @Request() req
  ): Promise<IJobPositionDocument> {
    
    return this.jobPositionService.restoreJobPosition(id /*, req.user.id*/);
  }

  @Delete(':id/hard-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard delete a job position by ID (irreversible, use with caution)' })
  @ApiParam({ name: 'id', description: 'The ID of the job position to hard delete', type: String })
  @ApiResponse({ status: 204, description: 'The job position has been successfully hard-deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async hardRemove(@Param('id') id: string): Promise<void> {
    
    await this.jobPositionService.hardDeleteJobPosition(id);
  }
}
