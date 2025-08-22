// src/recruitment/job-position/dto/create-job-position.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from 'src/recruitment/shared/enums';

export class CreateJobPositionDto {
  @ApiProperty({
    description: 'Title of the job position',
    example: 'Senior Software Engineer',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the job position',
    example: 'We are looking for a passionate Senior Software Engineer...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Department the job belongs to',
    example: 'Engineering',
  })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({
    description: 'Location of the job',
    example: 'New York, NY',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Employment type',
    enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
    example: 'Full-time',
  })
  @IsEnum(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'])
  @IsNotEmpty()
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';

  @ApiProperty({
    description: 'Minimum salary for the position (optional)',
    example: 80000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiProperty({
    description: 'Maximum salary for the position (optional)',
    example: 120000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf(o => o.salaryMin !== undefined) // Only validate if salaryMin is provided
  salaryMax?: number; // Add a custom validator to ensure salaryMax >= salaryMin

  @ApiProperty({
    description: 'Currency of the salary',
    example: 'USD',
    default: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: 'List of responsibilities for the job',
    example: ['Develop and maintain web applications', 'Collaborate with cross-functional teams'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  responsibilities: string[];

  @ApiProperty({
    description: 'List of required qualifications and skills',
    example: ['Bachelor\'s degree in CS', '5+ years of experience with Node.js'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  requirements: string[];

  @ApiProperty({
    description: 'List of benefits offered (optional)',
    example: ['Health insurance', 'Paid time off'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiProperty({
    description: 'Closing date for applications (optional)',
    example: '2025-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  closingDate?: Date;
}
