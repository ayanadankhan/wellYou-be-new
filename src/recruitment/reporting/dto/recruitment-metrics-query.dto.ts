// src/recruitment/reporting/dto/recruitment-metrics-query.dto.ts
import { IsOptional, IsString, IsDateString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecruitmentMetricsQueryDto {
  @ApiProperty({ description: 'Start date for filtering data (ISO date string, e.g., 2024-01-01)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for filtering data (ISO date string, e.g., 2024-12-31)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Filter metrics by a specific job position ID', required: false, example: '60c72b2f9b1d8a001c8a4c0a' })
  @IsOptional()
  @IsMongoId({ message: 'jobPositionId must be a valid MongoDB ID' })
  jobPositionId?: string;

  @ApiProperty({ description: 'Filter metrics by a specific department', required: false, example: 'Engineering' })
  @IsOptional()
  @IsString()
  department?: string;
}
