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
import { Type } from 'class-transformer';
import { CreateCandidateProfileDto } from '../../candidate-profile/dto/create-candidate-profile.dto';
import { JobType, ExperienceLevel } from '../../shared/enums'; // <--- Ensure ExperienceLevel is imported here

export class CreateApplicationDto {
  @IsMongoId({ message: 'jobPositionId must be a valid MongoDB ID.' })
  @IsNotEmpty()
  jobPositionId: string;

  @ValidateNested()
  @Type(() => CreateCandidateProfileDto)
  candidateProfileDetails: CreateCandidateProfileDto;

  @IsNotEmpty()
  @IsString()
  @IsUrl({}, { message: 'resumePath must be a valid URL.' })
  resumePath: string;

  @IsEnum(JobType)
  @IsNotEmpty()
  jobType: JobType;

  @IsEnum(ExperienceLevel)
  @IsNotEmpty()
  experienceLevel: ExperienceLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  source?: string;
}