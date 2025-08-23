// src/recruitment/candidate-profile/dto/candidate-profile-query.dto.ts

import { IsOptional, IsString, IsNumber, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { Gender, EducationLevel } from '../interfaces/candidate-profile.interface';
import { IPaginationQuery } from '../../shared/interfaces'; // Assuming correct path

export class CandidateProfileQueryDto implements IPaginationQuery {
  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Field to sort by', example: 'createdAt', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order (asc or desc)', example: 'desc', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'General keyword search across multiple fields (name, email, skills, notes, etc.)', example: 'senior typescript' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by candidate name (partial match)', example: 'Jane' })
  @IsOptional()
  @IsString()
  candidateName?: string;

  @ApiPropertyOptional({ description: 'Filter by candidate email (partial match)', example: 'jane.doe' })
  @IsOptional()
  @IsString()
  candidateEmail?: string;

  @ApiPropertyOptional({ description: 'Filter by candidate phone (partial match)', example: '+123' })
  @IsOptional()
  @IsString()
  candidatePhone?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum overall years of experience', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  overallExperienceYears?: number;

  @ApiPropertyOptional({ description: 'Filter by education level', enum: EducationLevel, example: EducationLevel.BACHELOR })
  @IsOptional()
  @IsEnum(EducationLevel)
  educationLevel?: EducationLevel;

  @ApiPropertyOptional({ description: 'Filter by gender', enum: Gender, example: Gender.FEMALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Filter by location (partial match)', example: 'London' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Filter by source (partial match)', example: 'LinkedIn' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Filter by general skills (comma-separated, e.g., "Node.js,React"). Matches if any skill is present.',
    type: String, // Keep as string for Swagger, transform later
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(s => s.trim()) : value))
  generalSkills?: string[];

  @ApiPropertyOptional({ description: 'Filter by availability for remote work', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAvailableForRemote?: boolean;
}