// src/recruitment/application/dto/update-application.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateIf,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../../shared/enums'; // Ensure path is correct

export class UpdateApplicationDto {
  @ApiPropertyOptional({
    description: 'Current status of the application.',
    enum: ApplicationStatus,
    example: ApplicationStatus.SCREENED,
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Reason for rejection (required if status is REJECTED).',
    example: 'Not a good fit for the team culture.',
  })
  @ValidateIf(o => o.status === ApplicationStatus.REJECTED)
  @IsString()
  @IsNotEmpty({ message: 'rejectionReason is required if status is REJECTED.' })
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'List of skills the candidate is highlighting for THIS specific job (optional).',
    example: ['REST API', 'GraphQL'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Any additional notes about this specific application (optional).',
    example: 'Followed up with candidate, awaiting response.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Source from which THIS specific application was received (optional).',
    example: 'Referral by existing employee.',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Date when the application was screened (ISO string).',
    type: 'string', format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  screeningDate?: Date;

  @ApiPropertyOptional({
    description: 'Date of the current/next interview for this application (ISO string).',
    type: 'string', format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  interviewDate?: Date;

  @ApiPropertyOptional({
    description: 'Date when the application was rejected (ISO string).',
    type: 'string', format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  rejectionDate?: Date;

  @ApiPropertyOptional({
    description: 'Date when the candidate was hired for this position (ISO string).',
    type: 'string', format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  hireDate?: Date;
}