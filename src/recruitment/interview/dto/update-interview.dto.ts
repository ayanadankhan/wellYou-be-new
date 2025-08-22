// src/recruitment/interview/dto/update-interview.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsDateString,
  Matches,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { InterviewType } from 'src/recruitment/shared/enums';

export class UpdateInterviewerDto {
  @ApiProperty({ description: 'ID of the interviewer (optional, for updating existing)', example: '60c72b2f9b1d8a001c8a4c0b', required: false })
  @IsOptional()
  @IsString() // Can be MongoId, but allowing string for partial updates
  userId?: string;

  @ApiProperty({ description: 'Name of the interviewer (optional)', example: 'Alice J.', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ description: 'Email of the interviewer (optional)', example: 'alice.johnson@example.com', required: false })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({ description: 'Role of the interviewer (optional)', example: 'Senior Engineer', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  role?: string;

  @ApiProperty({ description: 'Feedback provided by this interviewer (optional)', required: false })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiProperty({ description: 'Rating given by this interviewer (1-5, optional)', example: 5, required: false })
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class UpdateInterviewDto {
  @ApiProperty({
    description: 'List of interviewers involved in this interview. Existing interviewers can be updated, new ones added, or removed by not including them.',
    type: [UpdateInterviewerDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInterviewerDto)
  interviewers?: UpdateInterviewerDto[];

  @ApiProperty({
    description: 'Scheduled date of the interview (ISO date string)',
    example: '2025-08-25T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledDate?: Date;

  @ApiProperty({
    description: 'Start time of the interview in HH:MM format',
    example: '10:30',
    pattern: '^\d{2}:\d{2}$',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format (e.g., 10:00)' })
  startTime?: string;

  @ApiProperty({
    description: 'End time of the interview in HH:MM format',
    example: '11:30',
    pattern: '^\d{2}:\d{2}$',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format (e.g., 11:00)' })
  endTime?: string;

  @ApiProperty({
    description: 'Type of interview',
    enum: InterviewType,
    example: InterviewType.IN_PERSON,
    required: false,
  })
  @IsOptional()
  @IsEnum(InterviewType)
  type?: InterviewType;

  @ApiProperty({
    description: 'Location of the interview (e.g., office address or virtual meeting link)',
    example: 'Conference Room A',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiProperty({
    description: 'Any specific notes for the interview (e.g., topics to cover)',
    example: 'Technical deep-dive, include whiteboard session.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Overall feedback for the interview after completion',
    example: 'Candidate demonstrated strong technical skills but lacked communication.',
    required: false,
  })
  @IsOptional()
  @IsString()
  overallFeedback?: string;

  @ApiProperty({
    description: 'Overall aggregated rating for the interview (1-5, optional)',
    example: 3.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating?: number;

  @ApiProperty({
    description: 'Status of the interview',
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    example: 'Completed',
    required: false,
  })
  @IsOptional()
  @IsEnum(['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'])
  status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
}
