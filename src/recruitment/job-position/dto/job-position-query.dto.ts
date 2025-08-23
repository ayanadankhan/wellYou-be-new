// src/recruitment/job-position/dto/job-position-query.dto.ts
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { JobStatus, JobType, ExperienceLevel } from '../../shared/enums'; // Import JobType and ExperienceLevel

export class JobPositionQueryDto {
  @ApiProperty({ description: 'Page number for pagination', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: 'Number of items per page', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiProperty({ description: 'Field to sort by', required: false, example: 'postedDate' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'postedDate';

  @ApiProperty({ description: 'Sort order (asc or desc)', required: false, example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: 'Filter by department', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ description: 'Filter by location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Filter by job type', required: false, enum: JobType })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType; // ✨ Renamed from employmentType and using JobType enum

  @ApiProperty({ description: 'Filter by experience level', required: false, enum: ExperienceLevel })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel; // ✨ New field added

  @ApiProperty({ description: 'Filter by minimum salary', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMin?: number;

  @ApiProperty({ description: 'Filter by maximum salary', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMax?: number;

  @ApiProperty({ description: 'Filter by job status', required: false, enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiProperty({ description: 'General search keyword across title, description, department, location', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by minimum posted date (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  postedDateFrom?: string;

  @ApiProperty({ description: 'Filter by maximum posted date (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  postedDateTo?: string;
}