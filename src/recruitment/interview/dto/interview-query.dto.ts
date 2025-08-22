// src/recruitment/interview/dto/interview-query.dto.ts
import { IsOptional, IsString, IsNumber, IsEnum, IsMongoId, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InterviewType } from 'src/recruitment/shared/enums';
import { Transform, Type } from 'class-transformer';

export class InterviewQueryDto {
  @ApiProperty({ description: 'Page number for pagination', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: 'Number of items per page', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiProperty({ description: 'Field to sort by', required: false, example: 'scheduledDate' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'scheduledDate';

  @ApiProperty({ description: 'Sort order (asc or desc)', required: false, example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: 'Filter by Application ID', required: false, example: '60c72b2f9b1d8a001c8a4c0c' })
  @IsOptional()
  @IsMongoId({ message: 'applicationId must be a valid MongoDB ID' })
  applicationId?: string;

  @ApiProperty({ description: 'Filter by Job Position ID', required: false, example: '60c72b2f9b1d8a001c8a4c0a' })
  @IsOptional()
  @IsMongoId({ message: 'jobPositionId must be a valid MongoDB ID' })
  jobPositionId?: string;

  @ApiProperty({ description: 'Filter by interviewer User ID', required: false, example: '60c72b2f9b1d8a001c8a4c0b' })
  @IsOptional()
  @IsMongoId({ message: 'interviewerId must be a valid MongoDB ID' })
  interviewerId?: string;

  @ApiProperty({ description: 'Filter by interview type', required: false, enum: InterviewType })
  @IsOptional()
  @IsEnum(InterviewType)
  type?: InterviewType;

  @ApiProperty({ description: 'Filter by interview status', required: false, enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'] })
  @IsOptional()
  @IsEnum(['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'])
  status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';

  @ApiProperty({ description: 'Filter by minimum scheduled date (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  scheduledDateFrom?: string;

  @ApiProperty({ description: 'Filter by maximum scheduled date (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  scheduledDateTo?: string;

  @ApiProperty({ description: 'General keyword search across notes, interviewer names/emails', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
