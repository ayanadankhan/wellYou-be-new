// src/recruitment/interview/interview.controller.ts
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
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InterviewService } from './interview.service';
import { CreateInterviewDto} from './dto/create-interview.dto';
import { InterviewQueryDto } from './dto/interview-query.dto';
import { IInterviewDocument } from './schemas/interview.schema';
import { IPaginatedResponse } from 'src/recruitment/shared/interfaces';
import { InterviewType } from 'src/recruitment/shared/enums';
import { UpdateInterviewDto } from './dto/update-interview.dto';

@ApiTags('Interviews')
@Controller('interviews')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class InterviewController {
  private readonly logger = new Logger(InterviewController.name);

  constructor(private readonly interviewService: InterviewService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a new interview' })
  @ApiResponse({ status: 201, description: 'The interview has been successfully scheduled.', type: CreateInterviewDto })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation Error or invalid application/job position ID)' })
  @ApiResponse({ status: 404, description: 'Not Found (Application or Job Position not found)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async create(
    @Body() createInterviewDto: CreateInterviewDto,
    // @Request() req // Uncomment and use for getting user ID for createdBy
  ): Promise<IInterviewDocument> {
    this.logger.log('Received request to schedule interview.');
    // In a real app, get user ID from request (e.g., req.user.id)
    return this.interviewService.createInterview(createInterviewDto /*, req.user.id*/);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an interview by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the interview', type: String })
  @ApiResponse({ status: 200, description: 'The interview found.', type: CreateInterviewDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async findOne(@Param('id') id: string): Promise<IInterviewDocument> {
    
    return this.interviewService.getInterviewById(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all interviews with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'applicationId', required: false, type: String })
  @ApiQuery({ name: 'jobPositionId', required: false, type: String })
  @ApiQuery({ name: 'interviewerId', required: false, type: String, description: 'Filter by specific interviewer\'s userId' })
  @ApiQuery({ name: 'type', required: false, enum: InterviewType })
  @ApiQuery({ name: 'status', required: false, enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'] })
  @ApiQuery({ name: 'scheduledDateFrom', required: false, type: String,  description: 'Filter by minimum scheduled date (ISO string)' })
  @ApiQuery({ name: 'scheduledDateTo', required: false, type: String,  description: 'Filter by maximum scheduled date (ISO string)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'General keyword search' })
  @ApiResponse({ status: 200, description: 'A paginated list of interviews.', type: [CreateInterviewDto] })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async findAll(@Query() queryDto: InterviewQueryDto): Promise<IPaginatedResponse<IInterviewDocument>> {
    this.logger.log('Received request to get all interviews with filters.');
    return this.interviewService.getInterviews(queryDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an interview by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the interview', type: String })
  @ApiResponse({ status: 200, description: 'The interview has been successfully updated.', type: UpdateInterviewDto })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation Error)' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async update(
    @Param('id') id: string,
    @Body() updateInterviewDto: UpdateInterviewDto,
    // @Request() req // Uncomment and use for getting user ID for updatedBy
  ): Promise<IInterviewDocument> {
    
    // In a real app, get user ID from request (e.g., req.user.id)
    return this.interviewService.updateInterview(id, updateInterviewDto /*, req.user.id*/);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete an interview by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the interview', type: String })
  @ApiResponse({ status: 204, description: 'The interview has been successfully soft-deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async remove(
    @Param('id') id: string,
    // @Request() req // Uncomment and use for getting user ID for deletedBy
  ): Promise<void> {
    
    // In a real app, get user ID from request (e.g., req.user.id)
    await this.interviewService.deleteInterview(id /*, req.user.id*/);
  }

  @Put(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted interview by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the interview to restore', type: String })
  @ApiResponse({ status: 200, description: 'The interview has been successfully restored.', type: CreateInterviewDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async restore(
    @Param('id') id: string,
    // @Request() req
  ): Promise<IInterviewDocument> {
    
    return this.interviewService.restoreInterview(id /*, req.user.id*/);
  }

  @Delete(':id/hard-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard delete an interview by ID (irreversible)' })
  @ApiParam({ name: 'id', description: 'The ID of the interview to hard delete', type: String })
  @ApiResponse({ status: 204, description: 'The interview has been successfully hard-deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async hardRemove(@Param('id') id: string): Promise<void> {
    
    await this.interviewService.hardDeleteInterview(id);
  }
}
