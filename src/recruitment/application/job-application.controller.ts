// src/recruitment/application/job-application.controller.ts
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
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApplicationService } from './job-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { IApplicationDocument } from './interfaces/application.interface';
import { IPaginatedResponse } from 'src/recruitment/shared/interfaces';
import { ApplicationStatus, FileType } from 'src/recruitment/shared/enums';

@ApiTags('Applications')
@Controller('applications')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ApplicationController {
  private readonly logger = new Logger(ApplicationController.name);

  constructor(private readonly applicationService: ApplicationService) {}

@Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new job application (resume file temporarily optional for testing)' })
  // NO @ApiConsumes('multipart/form-data') anymore
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // ... (your existing properties)
        resumePath: { type: 'string', example: 'https://example.com/resumes/dummy_resume.pdf' }, // <-- Make sure this is here
      },
      required: ['jobPositionId', 'candidateName', 'candidateEmail', 'resumePath', 'skills', 'experienceYears', 'educationLevel'], // <-- And here
    },
  })
  // NO @UseInterceptors(FileInterceptor(...)) anymore
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    // REMOVED @UploadedFile() resume: Express.Multer.File,
    @Request() req: Request, // Keep this if you want to pass createdBy
  ): Promise<IApplicationDocument> {
    this.logger.log(`Received request to create application for job ${createApplicationDto.jobPositionId} by ${createApplicationDto.candidateEmail}.`);
    // REMOVED if (!resume) { ... } // This check is no longer relevant

    // Pass createApplicationDto.resumePath directly to the service
    return this.applicationService.createApplication(createApplicationDto, createApplicationDto.resumePath);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an application by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the application', type: String })
  @ApiResponse({ status: 200, description: 'The application found.', type: CreateApplicationDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async findOne(@Param('id') id: string): Promise<IApplicationDocument> {
    
    return this.applicationService.getApplicationById(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all applications with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'jobPositionId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @ApiQuery({ name: 'candidateName', required: false, type: String })
  @ApiQuery({ name: 'candidateEmail', required: false, type: String })
  @ApiQuery({ name: 'skills', required: false, type: String, description: 'Comma-separated skills' })
  @ApiQuery({ name: 'minExperience', required: false, type: Number })
  @ApiQuery({ name: 'educationLevel', required: false, enum: ['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'] })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'General keyword search' })
  @ApiQuery({ name: 'appliedDateFrom', required: false, type: String,  description: 'Filter by minimum applied date (ISO string)' })
  @ApiQuery({ name: 'appliedDateTo', required: false, type: String,  description: 'Filter by maximum applied date (ISO string)' })
  @ApiResponse({ status: 200, description: 'A paginated list of applications.', type: [CreateApplicationDto] })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async findAll(@Query() queryDto: ApplicationQueryDto): Promise<IPaginatedResponse<IApplicationDocument>> {
    this.logger.log('Received request to get all applications with filters.');
    return this.applicationService.getApplications(queryDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an application by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the application', type: String })
  @ApiResponse({ status: 200, description: 'The application has been successfully updated.', type: UpdateApplicationDto })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation Error or invalid status transition)' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    // @Request() req // Uncomment and use for getting user ID for updatedBy
  ): Promise<IApplicationDocument> {
    
    // In a real app, get user ID from request (e.g., req.user.id)
    return this.applicationService.updateApplication(id, updateApplicationDto /*, req.user.id*/);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete an application by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the application', type: String })
  @ApiResponse({ status: 204, description: 'The application has been successfully soft-deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async remove(
    @Param('id') id: string,
    // @Request() req // Uncomment and use for getting user ID for deletedBy
  ): Promise<void> {
    
    // In a real app, get user ID from request (e.g., req.user.id)
    await this.applicationService.deleteApplication(id /*, req.user.id*/);
  }

  @Put(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted application by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the application to restore', type: String })
  @ApiResponse({ status: 200, description: 'The application has been successfully restored.', type: CreateApplicationDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async restore(
    @Param('id') id: string,
    // @Request() req
  ): Promise<IApplicationDocument> {
    
    return this.applicationService.restoreApplication(id /*, req.user.id*/);
  }

  @Delete(':id/hard-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard delete an application by ID (irreversible, deletes resume file)' })
  @ApiParam({ name: 'id', description: 'The ID of the application to hard delete', type: String })
  @ApiResponse({ status: 204, description: 'The application has been successfully hard-deleted along with its resume file.' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async hardRemove(@Param('id') id: string): Promise<void> {
    
    await this.applicationService.hardDeleteApplication(id);
  }
}
