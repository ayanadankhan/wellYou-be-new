// src/recruitment/application/job-application.controller.ts

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

import { JobApplicationService } from './job-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { IApplicationDocument } from './interfaces/application.interface';
import { IPaginatedResponse } from '../shared/interfaces';
import { ApplicationStatus } from '../shared/enums';

@ApiTags('Applications')
@Controller('applications')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true })) // Apply globally to controller
export class ApplicationController {
  private readonly logger = new Logger(ApplicationController.name);

  constructor(private readonly applicationService: JobApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new job application and its associated candidate profile (if not already existing).' })
  @ApiBody({ type: CreateApplicationDto, description: 'Data for creating a new job application, including full candidate profile details.' })
  @ApiResponse({ status: 201, description: 'Application successfully created.', type: 'object' /* Consider a more specific response DTO */ })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation error, invalid ID, or failed candidate profile creation).' })
  @ApiResponse({ status: 404, description: 'Not Found (Job Position not found).' })
  @ApiResponse({ status: 409, description: 'Conflict (Duplicate application or candidate profile email/phone).' })
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Request() req: Request, // Use @Request() for accessing user from auth middleware
  ): Promise<IApplicationDocument> {
    this.logger.log(`Received request to create application for Job ID: ${createApplicationDto.jobPositionId}`);
    // Assuming `req.user.id` is populated by an authentication guard/middleware
    const createdBy = (req as any).user ? (req as any).user.id : undefined;
    return this.applicationService.createApplication(createApplicationDto, createdBy);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an application by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the application', type: String })
  @ApiResponse({ status: 200, description: 'The application found.', type: 'object' /* Specific DTO for response if needed */ })
  @ApiResponse({ status: 400, description: 'Bad Request (Invalid ID format).' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async findOne(@Param('id') id: string): Promise<IApplicationDocument> {
    this.logger.log(`Fetching application with ID: ${id}`);
    const application = await this.applicationService.getApplicationById(id);
    if (!application) {
      throw new NotFoundException(`Application with ID '${id}' not found.`);
    }
    return application;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all applications with filters and pagination' })
  // ApiQuery definitions are now automatically derived from ApplicationQueryDto
  // due to @UsePipes(new ValidationPipe({ transform: true })) and @Query() queryDto: ApplicationQueryDto
  // However, explicit ApiQuery for complex nested filters can be useful for Swagger clarity if needed.
  @ApiResponse({ status: 200, description: 'A paginated list of applications.', type: 'object' /* Adjust to reflect IPaginatedResponse<IApplicationDocument> */ })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation error).' })
  async findAll(@Query() queryDto: ApplicationQueryDto): Promise<IPaginatedResponse<IApplicationDocument>> {
    this.logger.log('Received request to get all applications with filters.');
    this.logger.debug(`Query: ${JSON.stringify(queryDto)}`);
    return this.applicationService.getApplications(queryDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an application by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the application', type: String })
  @ApiBody({ type: UpdateApplicationDto, description: 'Partial data for updating a job application' })
  @ApiResponse({ status: 200, description: 'The application has been successfully updated.', type: 'object' })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation Error or invalid status transition).' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Request() req: Request,
  ): Promise<IApplicationDocument> {
    this.logger.log(`Received request to update application with ID: ${id}`);
    const updatedBy = (req as any).user ? (req as any).user.id : undefined;
    return this.applicationService.updateApplication(id, updateApplicationDto, updatedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Use 204 for successful deletion with no content
  @ApiOperation({ summary: 'Soft delete an application by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the application', type: String })
  @ApiResponse({ status: 204, description: 'Application successfully soft-deleted.' })
  @ApiResponse({ status: 400, description: 'Bad Request (Invalid ID format).' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async remove(
    @Param('id') id: string,
    @Request() req: Request,
  ): Promise<void> {
    this.logger.log(`Received request to soft delete application with ID: ${id}`);
    const deletedBy = (req as any).user ? (req as any).user.id : undefined;
    await this.applicationService.removeApplication(id, deletedBy);
  }
}