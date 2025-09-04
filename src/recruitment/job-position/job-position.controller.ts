// ===== 7. CONTROLLER =====
// src/job-posting/controllers/job-posting.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JobPostingService } from './job-position.service';
import { CreateJobPostingDto } from './dto/create-job-position.dto';
import { UpdateJobPostingDto } from './dto/update-job-position.dto';
import { JobPositionQueryDto } from './dto/job-position-query.dto';
import { GenerateJobDescriptionDto } from './dto/job-description.dto';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { User } from '@/modules/tenant/users/schemas/user.schema';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('job-postings')
@Controller('job-postings')
export class JobPostingController {
  constructor(private readonly jobPostingService: JobPostingService) {}

  @Post()
  create(@Body() createJobPostingDto: CreateJobPostingDto, @CurrentUser() user: User)  {
    return this.jobPostingService.create(createJobPostingDto, user);
  }

    @Post('generate-description')
  @ApiOperation({ summary: 'Generate a professional job description using AI' })
  @ApiResponse({ status: 200, description: 'Job description generated successfully', type: 'string' })
  generateDescription(@Body() generateDto: GenerateJobDescriptionDto) {
    return this.jobPostingService.generateAiDescription(generateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all job postings with filtering' })
  @ApiResponse({ status: 200, description: 'Job postings retrieved successfully' })
  findAll(@Query() query: JobPositionQueryDto) {
    return this.jobPostingService.findAll(query);
  }

  @Get('public')
  @Public()
  findAllJobsPublic() {
    return this.jobPostingService.findAllPublic();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job posting by ID' })
  @ApiParam({ name: 'id', description: 'Job posting ID' })
  @ApiResponse({ status: 200, description: 'Job posting retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  findOne(@Param('id') id: string) {
    return this.jobPostingService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job posting' })
  @ApiParam({ name: 'id', description: 'Job posting ID' })
  @ApiResponse({ status: 200, description: 'Job posting updated successfully' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  update(@Param('id') id: string, @Body() updateJobPostingDto: UpdateJobPostingDto) {
    return this.jobPostingService.update(id, updateJobPostingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job posting' })
  @ApiParam({ name: 'id', description: 'Job posting ID' })
  @ApiResponse({ status: 200, description: 'Job posting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  remove(@Param('id') id: string) {
    return this.jobPostingService.remove(id);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a job posting' })
  @ApiParam({ name: 'id', description: 'Job posting ID' })
  @ApiResponse({ status: 200, description: 'Job posting published successfully' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  publish(@Param('id') id: string) {
    return this.jobPostingService.publish(id);
  }
}
