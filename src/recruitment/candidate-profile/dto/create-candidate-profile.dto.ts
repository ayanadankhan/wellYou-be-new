// src/recruitment/candidate-profile/dto/create-candidate-profile.dto.ts

import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsDateString,
  ValidateNested,
  IsBoolean,
  Min,
  IsUrl,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Gender,
  MaritalStatus,
  EducationLevel,
  IContact,
  IDependentMember,
  IEducationEntry,
  IExperienceEntry,
  ICertification,
  IDocument,
} from '../interfaces/candidate-profile.interface';

// Nested DTOs for sub-documents
export class CreateContactDto implements IContact {
  @ApiProperty() @IsNotEmpty() @IsString() name: string;
  @ApiProperty() @IsNotEmpty() @IsString() relationship: string;
  @ApiProperty() @IsNotEmpty() @IsString() phoneNumber: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
}

export class CreateDependentMemberDto implements IDependentMember {
  @ApiProperty() @IsNotEmpty() @IsString() name: string;
  @ApiProperty() @IsNotEmpty() @IsString() relationship: string;
  @ApiProperty() @IsNotEmpty() @IsDateString() dateOfBirth: Date;
}

export class CreateEducationEntryDto implements IEducationEntry {
  @ApiProperty({ enum: EducationLevel })
  @IsNotEmpty()
  @IsEnum(EducationLevel)
  level: EducationLevel;

  @ApiProperty() @IsNotEmpty() @IsString() degree: string;
  @ApiProperty() @IsNotEmpty() @IsString() institution: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fieldOfStudy?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1900) graduationYear?: number; // Added Min validation
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: Date;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateExperienceEntryDto implements IExperienceEntry {
  @ApiProperty() @IsNotEmpty() @IsString() jobTitle: string;
  @ApiProperty() @IsNotEmpty() @IsString() company: string;
  @ApiProperty() @IsNotEmpty() @IsDateString() startDate: Date;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCurrent?: boolean;
}

export class CreateCertificationDto implements ICertification {
  @ApiProperty() @IsNotEmpty() @IsString() name: string;
  @ApiProperty() @IsNotEmpty() @IsString() issuingOrganization: string;
  @ApiProperty() @IsNotEmpty() @IsDateString() issueDate: Date;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expirationDate?: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() credentialId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() credentialUrl?: string; // Added validation
}

export class CreateDocumentDto implements IDocument {
  @ApiProperty() @IsNotEmpty() @IsString() documentName: string;
  @ApiProperty() @IsNotEmpty() @IsString() documentType: string;
  @ApiProperty() @IsNotEmpty() @IsString() filePath: string;
  @ApiProperty() @IsNotEmpty() @IsDateString() uploadedAt: Date;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: Date;
}

// DTO for Salary Expectation
export class SalaryExpectationDto {
  @ApiProperty() @IsNotEmpty() @IsNumber() @Min(0) amount: number;
  @ApiProperty() @IsNotEmpty() @IsString() currency: string;
  @ApiProperty({ enum: ['yearly', 'monthly', 'hourly'] }) @IsNotEmpty() @IsEnum(['yearly', 'monthly', 'hourly']) period: 'yearly' | 'monthly' | 'hourly';
}

// Main DTO for creating a Candidate Profile
export class CreateCandidateProfileDto {
  @ApiProperty() @IsNotEmpty() @IsString() candidateName: string;
  @ApiProperty() @IsNotEmpty() @IsEmail() candidateEmail: string;
  @ApiPropertyOptional() @IsOptional() @IsString() candidatePhone?: string; // Optionalized

  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: Date;
  @ApiPropertyOptional() @IsOptional() @IsUrl() profilePicture?: string; // Validated as URL
  @ApiPropertyOptional({ enum: Gender }) @IsOptional() @IsEnum(Gender) gender?: Gender;
  @ApiPropertyOptional({ enum: MaritalStatus }) @IsOptional() @IsEnum(MaritalStatus) maritalStatus?: MaritalStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nationality?: string;

  @ApiPropertyOptional({ type: CreateContactDto })
  @IsOptional() @ValidateNested() @Type(() => CreateContactDto)
  emergencyContact?: CreateContactDto;

  @ApiPropertyOptional({ type: [CreateDependentMemberDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateDependentMemberDto)
  dependentMembers?: CreateDependentMemberDto[];

  @ApiPropertyOptional({ type: [CreateEducationEntryDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateEducationEntryDto)
  education?: CreateEducationEntryDto[];

  @ApiPropertyOptional({ type: [CreateExperienceEntryDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateExperienceEntryDto)
  experiences?: CreateExperienceEntryDto[];

  @ApiPropertyOptional({ type: [CreateCertificationDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateCertificationDto)
  certifications?: CreateCertificationDto[];

  @ApiPropertyOptional({ type: [CreateDocumentDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateDocumentDto)
  documents?: CreateDocumentDto[];

  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) generalSkills?: string[];
  @ApiPropertyOptional() @IsOptional() @IsUrl() resumeUrl?: string; // Validated as URL
  @ApiPropertyOptional() @IsOptional() @IsUrl() linkedInProfile?: string; // Validated as URL
  @ApiPropertyOptional() @IsOptional() @IsUrl() portfolioUrl?: string; // Validated as URL
  @ApiPropertyOptional() @IsOptional() @IsUrl() githubProfile?: string; // Validated as URL
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) overallExperienceYears?: number;

  @ApiPropertyOptional({ type: SalaryExpectationDto })
  @IsOptional() @IsObject() @ValidateNested() @Type(() => SalaryExpectationDto)
  salaryExpectation?: SalaryExpectationDto;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAvailableForRemote?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) preferredJobTitles?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) preferredLocations?: string[];

  // This should ideally be set by the system based on authentication
  @ApiPropertyOptional({ description: 'User ID of the creator (set by system)', readOnly: true })
  @IsOptional() @IsString() createdBy?: string;
}