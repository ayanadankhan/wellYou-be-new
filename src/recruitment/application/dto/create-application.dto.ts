// src/recruitment/application/dto/create-application.dto.ts
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
  IsMongoId,
  IsUrl, // <-- Add IsUrl if you expect a valid URL
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'ID of the job position this application is for',
    example: '60c72b2f9b1d8a001c8a4c0a',
  })
  @IsMongoId({ message: 'jobPositionId must be a valid MongoDB ID' })
  @IsNotEmpty()
  jobPositionId: string;

  @ApiProperty({
    description: 'Full name of the candidate',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  candidateName: string;

  @ApiProperty({
    description: 'Email address of the candidate',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  candidateEmail: string;

  @ApiProperty({
    description: 'Phone number of the candidate (optional)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'candidatePhone must be a valid international phone number' })
  candidatePhone?: string;

  @ApiProperty({
    description: 'URL or path to the candidate\'s resume file',
    example: 'https://your-storage.com/resumes/john_doe_resume.pdf',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl() // Uncomment this if you want to strictly validate as a URL
  resumePath: string; // <-- ADD THIS PROPERTY

  @ApiProperty({
    description: 'List of skills of the candidate',
    example: ['Node.js', 'React', 'MongoDB'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  skills: string[];

  @ApiProperty({
    description: 'Years of professional experience',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  experienceYears: number;

  @ApiProperty({
    description: 'Highest education level of the candidate',
    enum: ['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'],
    example: 'Bachelor\'s Degree',
  })
  @IsEnum(['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'])
  educationLevel: 'High School' | 'Associate Degree' | 'Bachelor\'s Degree' | 'Master\'s Degree' | 'PhD';

  @ApiProperty({
    description: 'Any additional notes about the application (optional)',
    example: 'Strong communication skills',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Source from which the application was received (optional)',
    example: 'LinkedIn',
    required: false,
  })
  @IsOptional()
  @IsString()
  source?: string;
}