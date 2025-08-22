// src/recruitment/application/dto/update-application.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ArrayMinSize,
  IsEnum,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus } from 'src/recruitment/shared/enums';

export class UpdateApplicationDto {
  @ApiProperty({
    description: 'Full name of the candidate',
    example: 'Johnathan Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  candidateName?: string;

  @ApiProperty({
    description: 'Email address of the candidate',
    example: 'john.doe.updated@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  candidateEmail?: string;

  @ApiProperty({
    description: 'Phone number of the candidate (optional)',
    example: '+9876543210',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'candidatePhone must be a valid international phone number' })
  candidatePhone?: string;

  @ApiProperty({
    description: 'Current status of the application',
    enum: ApplicationStatus,
    example: ApplicationStatus.SCREENING,
    required: false,
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiProperty({
    description: 'Reason for rejection (required if status is REJECTED)',
    example: 'Not a good fit for the role',
    required: false,
  })
  @ValidateIf(o => o.status === ApplicationStatus.REJECTED)
  @IsString()
  @IsNotEmpty({ message: 'rejectionReason is required if status is REJECTED' })
  rejectionReason?: string;

  @ApiProperty({
    description: 'List of skills of the candidate',
    example: ['Node.js', 'React', 'TypeScript'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  skills?: string[];

  @ApiProperty({
    description: 'Years of professional experience',
    example: 6,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @ApiProperty({
    description: 'Highest education level of the candidate',
    enum: ['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'],
    example: 'Master\'s Degree',
    required: false,
  })
  @IsOptional()
  @IsEnum(['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'])
  educationLevel?: 'High School' | 'Associate Degree' | 'Bachelor\'s Degree' | 'Master\'s Degree' | 'PhD';

  @ApiProperty({
    description: 'Any additional notes about the application (optional)',
    example: 'Updated contact details',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Source from which the application was received (optional)',
    example: 'Referral',
    required: false,
  })
  @IsOptional()
  @IsString()
  source?: string;
}
