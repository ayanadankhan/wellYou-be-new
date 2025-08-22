// src/recruitment/application/dto/application-query.dto.ts
import { IsOptional, IsString, IsNumber, IsEnum, IsMongoId, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus } from 'src/recruitment/shared/enums';
import { Transform, Type } from 'class-transformer';

export class ApplicationQueryDto {
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

  @ApiProperty({ description: 'Field to sort by', required: false, example: 'appliedDate' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'appliedDate';

  @ApiProperty({ description: 'Sort order (asc or desc)', required: false, example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: 'Filter by Job Position ID', required: false, example: '60c72b2f9b1d8a001c8a4c0a' })
  @IsOptional()
  @IsMongoId({ message: 'jobPositionId must be a valid MongoDB ID' })
  jobPositionId?: string;

  @ApiProperty({ description: 'Filter by application status', required: false, enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiProperty({ description: 'Filter by candidate name (partial match)', required: false })
  @IsOptional()
  @IsString()
  candidateName?: string;

  @ApiProperty({ description: 'Filter by candidate email (partial match)', required: false })
  @IsOptional()
  @IsString()
  candidateEmail?: string;

  @ApiProperty({
    description: 'Filter by skills (comma-separated, e.g., "Node.js,React"). Will match if any of the skills are present.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(s => s.trim()) : value))
  skills?: string[];

  @ApiProperty({ description: 'Filter by minimum years of experience', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  
  minExperience?: number;

  @ApiProperty({ description: 'Filter by education level', required: false, enum: ['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'] })
  @IsOptional()
  @IsEnum(['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'])
  educationLevel?: 'High School' | 'Associate Degree' | 'Bachelor\'s Degree' | 'Master\'s Degree' | 'PhD';

  @ApiProperty({ description: 'General keyword search across candidate name, email, skills, notes', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by minimum applied date (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  appliedDateFrom?: string;

  @ApiProperty({ description: 'Filter by maximum applied date (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  appliedDateTo?: string;
}
