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
  IsDateString,
  ValidateIf,
  IsObject,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer'; // Needed for @Type decorator with nested objects
import { ApiProperty } from '@nestjs/swagger';
import { JobType, ExperienceLevel, JobStatus } from '../../shared/enums'; // Adjust path as needed for your enums

// DTO for salaryRange nested object
export class SalaryRangeDto {
  @ApiProperty({ description: 'Minimum salary for the position', example: 80000 })
  @IsNumber()
  @Min(0)
  min: number;

  @ApiProperty({ description: 'Maximum salary for the position', example: 120000 })
  @IsNumber()
  @Min(0)
  max: number;

  @ApiProperty({ description: 'Currency of the salary', example: 'USD', default: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Period of salary (e.g., yearly, monthly, hourly)', example: 'yearly' })
  @IsString()
  @IsNotEmpty()
  period: 'yearly' | 'monthly' | 'hourly'; // Ensure this matches your schema's period type
}


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

  @IsMongoId()
  @IsNotEmpty()
  department: string; // ✨ Kept as required based on error "department should not be empty"

  @ApiProperty({
    description: 'Location of the job',
    example: 'New York, NY',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Type of job (e.g., FULL_TIME, PART_TIME)',
    enum: JobType, // ✨ Using the enum
    example: JobType.FULL_TIME,
  })
  @IsEnum(JobType) // ✨ Use @IsEnum with your actual enum
  @IsNotEmpty()
  jobType: JobType; // ✨ Renamed from employmentType

  @ApiProperty({
    description: 'Experience level required for the job (e.g., ENTRY_LEVEL, SENIOR)',
    enum: ExperienceLevel, // ✨ Using the enum
    example: ExperienceLevel.SENIOR,
  })
  @IsEnum(ExperienceLevel) // ✨ Use @IsEnum with your actual enum
  @IsNotEmpty()
  experienceLevel: ExperienceLevel; // ✨ New field added

  @ApiProperty({
    description: 'Salary range for the position',
    type: SalaryRangeDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SalaryRangeDto) // Important for nested DTOs
  salaryRange?: SalaryRangeDto; // ✨ Aligned with schema's nested object structure

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