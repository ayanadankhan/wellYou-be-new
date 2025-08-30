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
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JobPositionService } from './job-position.service';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { IJobPositionDocument } from './interfaces/job-position.interface';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';
import { GetJobPositionDto } from './dto/get-job-position.dto';

@ApiTags('Job Positions')
@Controller('job-positions')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true })) // Enable validation and transformation globally for this controller
export class JobPositionController {
  private readonly logger = new Logger(JobPositionController.name);

  constructor(private readonly jobPositionService: JobPositionService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createJobPositionDto: CreateJobPositionDto,
  ): Promise<IJobPositionDocument> {
    this.logger.log('Received request to create job position.');
    if (!user) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    return this.jobPositionService.createJobPosition(createJobPositionDto , user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<IJobPositionDocument> {
    return this.jobPositionService.getJobPositionById(id);
  }

  @Get()
  async findAll(@Query() queryDto: GetJobPositionDto , @CurrentUser() user : AuthenticatedUser) {
    this.logger.log('Received request to get all job positions with filters.');
    return this.jobPositionService.getJobPositions(queryDto, user);
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
    @Body() updateJobPositionDto: CreateJobPositionDto,
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
    await this.jobPositionService.remove(id /*, req.user.id*/);
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
    
    await this.jobPositionService.remove(id);
  }
}
