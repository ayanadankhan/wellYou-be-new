import { IsOptional, IsString, IsNumber, IsEnum, IsMongoId, IsDateString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ApplicationStatus } from '../../shared/enums';
import { EducationLevel, Gender } from '../../candidate-profile/interfaces/candidate-profile.interface'; // Import enums from candidate profile
import { IPaginationQuery } from '../../shared/interfaces';

// Nested DTO for filtering by candidate profile attributes
export class CandidateProfileFilterDto {
  @IsOptional()
  @IsString() candidateName?: string;

  @IsOptional()
  @IsString() candidateEmail?: string;

  @IsOptional()
  @IsString() candidatePhone?: string;

  @IsOptional()
  @Type(() => Number) @IsNumber() minExperience?: number;

  @IsOptional()
  @IsEnum(EducationLevel) educationLevel?: EducationLevel;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(s => s.trim()) : value))
  skills?: string[]; // Renamed to `generalSkills` for clarity if targeting `generalSkills` field on profile

  @IsOptional()
  @IsEnum(Gender) gender?: Gender;

  @IsOptional()
  @IsString() location?: string;
}

export class ApplicationQueryDto implements IPaginationQuery {
  @IsOptional()
  @Type(() => Number) @IsNumber() page?: number = 1;

  @IsOptional()
  @Type(() => Number) @IsNumber() limit?: number = 10;

  @IsOptional()
  @IsString() sortBy?: string = 'appliedDate';

  @IsOptional()
  @IsEnum(['asc', 'desc']) sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsMongoId({ message: 'jobPositionId must be a valid MongoDB ID.' }) jobPositionId?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus) status?: ApplicationStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => CandidateProfileFilterDto)
  candidateProfileFilters?: CandidateProfileFilterDto; // Nested DTO for candidate profile filtering

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(s => s.trim()) : value))
  applicationSkills?: string[]; // Skills field on the application itself

  @IsOptional()
  @IsString() search?: string;

  @IsOptional()
  @IsDateString() appliedDateFrom?: string;

  @IsOptional()
  @IsDateString() appliedDateTo?: string;

  @IsOptional()
  @IsString() source?: string;
}
