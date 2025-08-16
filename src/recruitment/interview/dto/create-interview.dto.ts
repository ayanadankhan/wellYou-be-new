// src/recruitment/interview/dto/create-interview.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Matches,
  IsEnum,
  IsEmail,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { InterviewType } from 'src/recruitment/shared/enums';

export class CreateInterviewerDto {
  @ApiProperty({ description: 'ID of the interviewer (e.g., user/employee ID)', example: '60c72b2f9b1d8a001c8a4c0b' })
  @IsMongoId({ message: 'userId must be a valid MongoDB ID' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Name of the interviewer', example: 'Alice Johnson' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email of the interviewer', example: 'alice.j@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Role of the interviewer (e.g., Hiring Manager, HR)', example: 'Hiring Manager' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ description: 'Feedback provided by this interviewer (optional)', required: false })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiProperty({ description: 'Rating given by this interviewer (1-5, optional)', example: 4, required: false })
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class CreateInterviewDto {
  @ApiProperty({
    description: 'ID of the application this interview is for',
    example: '60c72b2f9b1d8a001c8a4c0c',
  })
  @IsMongoId({ message: 'applicationId must be a valid MongoDB ID' })
  @IsNotEmpty()
  applicationId: string;

  @ApiProperty({
    description: 'ID of the job position this interview is for (redundant but useful for quick lookup)',
    example: '60c72b2f9b1d8a001c8a4c0a',
  })
  @IsMongoId({ message: 'jobPositionId must be a valid MongoDB ID' })
  @IsNotEmpty()
  jobPositionId: string;

  @ApiProperty({
    description: 'List of interviewers involved in this interview',
    type: [CreateInterviewerDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInterviewerDto)
  interviewers: CreateInterviewerDto[];

  @ApiProperty({
    description: 'Scheduled date of the interview (ISO date string)',
    example: '2025-08-20T09:00:00.000Z',
  })
  @IsDateString()
  scheduledDate: Date;

  @ApiProperty({
    description: 'Start time of the interview in HH:MM format',
    example: '10:00',
    pattern: '^\d{2}:\d{2}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format (e.g., 10:00)' })
  startTime: string;

  @ApiProperty({
    description: 'End time of the interview in HH:MM format',
    example: '11:00',
    pattern: '^\d{2}:\d{2}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format (e.g., 11:00)' })
  endTime: string;

  @ApiProperty({
    description: 'Type of interview',
    enum: InterviewType,
    example: InterviewType.VIDEO,
  })
  @IsEnum(InterviewType)
  type: InterviewType;

  @ApiProperty({
    description: 'Location of the interview (e.g., office address or video conference link)',
    example: 'Zoom Meeting Link: https://zoom.us/j/1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiProperty({
    description: 'Any specific notes for the interview (e.g., topics to cover)',
    example: 'Focus on technical skills and problem-solving.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
