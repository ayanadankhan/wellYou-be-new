// src/recruitment/application/dto/create-application.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsUrl,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateCandidateProfileDto } from '../../candidate-profile/dto/create-candidate-profile.dto';
import { JobType, ExperienceLevel } from '../../shared/enums'; // <--- Ensure ExperienceLevel is imported here

export class CreateApplicationDto {
  @ApiProperty({
    description: 'ID of the job position this application is for.',
    example: '60c72b2f9b1d8a001c8a4c0a',
  })
  @IsMongoId({ message: 'jobPositionId must be a valid MongoDB ID.' })
  @IsNotEmpty()
  jobPositionId: string;

  @ApiProperty({
    type: CreateCandidateProfileDto,
    description: 'Details for creating a new candidate profile or finding an existing one. If an existing profile is found by email (and then by phone if email fails), it will be linked; otherwise, a new profile will be created with these details. Candidate email is mandatory here.',
  })
  @ValidateNested()
  @Type(() => CreateCandidateProfileDto)
  candidateProfileDetails: CreateCandidateProfileDto;

  @ApiProperty({
    description: 'URL or path to the candidate\'s resume file specifically for THIS application.',
    example: 'https://your-storage.com/resumes/john_doe_backend_dev.pdf',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl({}, { message: 'resumePath must be a valid URL.' })
  resumePath: string;

  @ApiProperty({
    description: 'The type of job for which this application is submitted.',
    enum: JobType,
    example: JobType.FULL_TIME,
  })
  @IsEnum(JobType)
  @IsNotEmpty()
  jobType: JobType;

  // 🚀 THIS IS THE CRUCIAL ADDITION/CORRECTION 🚀
  @ApiProperty({
    description: 'The experience level for THIS specific application.',
    enum: ExperienceLevel,
    example: ExperienceLevel.SENIOR,
  })
  @IsEnum(ExperienceLevel)
  @IsNotEmpty()
  experienceLevel: ExperienceLevel;
  // 🚀 END OF CORRECTION 🚀

  @ApiPropertyOptional({
    description: 'List of skills the candidate is highlighting for THIS specific job application (optional).',
    example: ['Node.js', 'TypeScript', 'Microservices'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Any additional notes about this specific application (optional).',
    example: 'Candidate is highly motivated and quick learner.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Source from which THIS specific application was received (optional, e.g., LinkedIn, Indeed, Referral, Company Website).',
    example: 'LinkedIn',
  })
  @IsOptional()
  @IsString()
  source?: string;
}