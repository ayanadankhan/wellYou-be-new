import { IsOptional, IsString, IsNumber, IsEnum, IsMongoId, IsDateString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ApplicationStatus } from '../../shared/enums';
import { EducationLevel, Gender } from '../../candidate-profile/interfaces/candidate-profile.interface'; // Import enums from candidate profile
import { IPaginationQuery } from '../../shared/interfaces';

// Nested DTO for filtering by candidate profile attributes
export class CandidateProfileFilterDto {
  @ApiPropertyOptional({ description: 'Filter by candidate name (partial match)', example: 'Alice' })
  @IsOptional() @IsString() candidateName?: string;

  @ApiPropertyOptional({ description: 'Filter by candidate email (partial match)', example: 'alice@example.com' })
  @IsOptional() @IsString() candidateEmail?: string;

  @ApiPropertyOptional({ description: 'Filter by candidate phone (partial match)', example: '+123' })
  @IsOptional() @IsString() candidatePhone?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum years of experience', example: 5 })
  @IsOptional() @Type(() => Number) @IsNumber() minExperience?: number;

  @ApiPropertyOptional({ description: 'Filter by education level', enum: EducationLevel, example: EducationLevel.BACHELOR })
  @IsOptional() @IsEnum(EducationLevel) educationLevel?: EducationLevel;

  @ApiPropertyOptional({ description: 'Filter by skills on candidate profile (comma-separated, e.g., "Node.js,React"). Will match if any of the skills are present.', })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(s => s.trim()) : value))
  skills?: string[]; // Renamed to `generalSkills` for clarity if targeting `generalSkills` field on profile

  @ApiPropertyOptional({ description: 'Filter by gender on candidate profile', enum: Gender, example: Gender.FEMALE })
  @IsOptional() @IsEnum(Gender) gender?: Gender;

  @ApiPropertyOptional({ description: 'Filter by location on candidate profile (partial match)', example: 'New York' })
  @IsOptional() @IsString() location?: string;
}

export class ApplicationQueryDto implements IPaginationQuery {
  @ApiPropertyOptional({ description: 'Page number for pagination', required: false, default: 1 })
  @IsOptional() @Type(() => Number) @IsNumber() page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', required: false, default: 10 })
  @IsOptional() @Type(() => Number) @IsNumber() limit?: number = 10;

  @ApiPropertyOptional({ description: 'Field to sort by', required: false, example: 'appliedDate', default: 'appliedDate' })
  @IsOptional() @IsString() sortBy?: string = 'appliedDate';

  @ApiPropertyOptional({ description: 'Sort order (asc or desc)', required: false, example: 'desc', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional() @IsEnum(['asc', 'desc']) sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Filter by Job Position ID', required: false, example: '60c72b2f9b1d8a001c8a4c0a' })
  @IsOptional() @IsMongoId({ message: 'jobPositionId must be a valid MongoDB ID.' }) jobPositionId?: string;

  @ApiPropertyOptional({ description: 'Filter by application status', required: false, enum: ApplicationStatus, example: ApplicationStatus.APPLIED })
  @IsOptional() @IsEnum(ApplicationStatus) status?: ApplicationStatus;

  @ApiPropertyOptional({ type: CandidateProfileFilterDto, description: 'Filters to apply on the associated Candidate Profile.' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CandidateProfileFilterDto)
  candidateProfileFilters?: CandidateProfileFilterDto; // Nested DTO for candidate profile filtering

  @ApiPropertyOptional({
    description: 'Filter by skills specific to the *application* (comma-separated, e.g., "SQL,Python"). Matches if any of the skills are present.',
    type: String, // Keep as string for Swagger, transform later
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(s => s.trim()) : value))
  applicationSkills?: string[]; // Skills field on the application itself

  @ApiPropertyOptional({ description: 'General keyword search across application notes, source, AND candidate profile name, email, skills', required: false })
  @IsOptional() @IsString() search?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum applied date (ISO string)', example: '2023-01-01T00:00:00.000Z' })
  @IsOptional() @IsDateString() appliedDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by maximum applied date (ISO string)', example: '2023-12-31T23:59:59.999Z' })
  @IsOptional() @IsDateString() appliedDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by source of application', example: 'Company Website' })
  @IsOptional() @IsString() source?: string;
}
