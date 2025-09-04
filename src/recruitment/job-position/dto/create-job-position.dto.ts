// ===== 4. DTOs =====
// src/job-posting/dto/create-job-posting.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsEmail, IsDate, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobType, ExperienceLevel, WorkplaceType } from '../../shared/enums';

class LocationDto {
  @ApiProperty({ example: 'Bengaluru' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: 'IN' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ enum: WorkplaceType, example: WorkplaceType.HYBRID })
  @IsEnum(WorkplaceType)
  workplaceType: WorkplaceType;
}

class SalaryRangeDto {
  @ApiProperty({ example: 90000 })
  @IsNumber()
  @Min(0)
  min: number;

  @ApiProperty({ example: 130000 })
  @IsNumber()
  @Min(0)
  max: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @ApiPropertyOptional({ example: 'YEARLY', default: 'YEARLY' })
  @IsString()
  @IsOptional()
  period?: 'YEARLY' | 'MONTHLY' | 'HOURLY' = 'YEARLY';
}

export class CreateJobPostingDto {
  @ApiProperty({ example: 'Senior Backend Developer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    example: 'We are seeking a highly skilled Senior Backend Developer to join our growing engineering team. You will be responsible for designing, developing, and maintaining robust and scalable backend systems using Node.js, NestJS, and MongoDB...' 
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ enum: JobType, example: JobType.FULL_TIME })
  @IsEnum(JobType)
  jobType: JobType;

  @ApiProperty({ enum: ExperienceLevel, example: ExperienceLevel.SENIOR })
  @IsEnum(ExperienceLevel)
  experienceLevel: ExperienceLevel;

  @ApiPropertyOptional({ type: SalaryRangeDto })
  @ValidateNested()
  @Type(() => SalaryRangeDto)
  @IsOptional()
  salaryRange?: SalaryRangeDto;

  @ApiProperty({ example: 'careers@techinnovators.com' })
  @IsEmail()
  applicationEmail: string;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  closingDate?: Date;
}