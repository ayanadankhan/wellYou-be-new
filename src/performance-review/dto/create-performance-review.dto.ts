import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Enums ---
export enum ReviewPeriodEnum {
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4',
  Annual = 'Annual',
}

export enum SkillLevelEnum {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum RecommendedActionEnum {
  INCREMENT = 'INCREMENT',
  PIP = 'PIP',
  PROMOTION = 'PROMOTION',
  NO_ACTION = 'NO_ACTION',
}

// --- Nested DTOs ---
export class CertificationDto {
  @IsString()
  name: string;

  @IsString()
  verificationUrl: string;
}

export class SkillDto {
  @IsString()
  name: string;

  @IsEnum(SkillLevelEnum)
  level: SkillLevelEnum;
}

export class EmployeeSnapshotDto {
  @IsString()
  name: string;

  @IsString()
  profilePicture: string;

  @IsString()
  designation: string;

  @IsDateString()
  joiningDate: string;

  @IsString()
  totalJobDuration: string;

  @IsString()
  totalExperience: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications: CertificationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills: SkillDto[];
}

export class AttendanceSummaryDto {
  @IsNumber()
  totalWorkingDays: number;

  @IsNumber()
  presentDays: number;

  @IsNumber()
  absentDays: number;

  @IsNumber()
  lateCheckins: number;
}

export class LeaveByTypeDto {
  @IsString()
  type: string;

  @IsNumber()
  count: number;
}

export class LeaveSummaryDto {
  @IsNumber()
  totalLeaves: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeaveByTypeDto)
  byType: LeaveByTypeDto[];
}

export class RatingDto {
  @IsString()
  category: string;

  @IsNumber()
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class SalaryAtReviewDto {
  @IsNumber()
  basePay: number;

  @IsString()
  currency: string;
}

// --- Main DTO ---
export class CreatePerformanceReviewDto {
  @IsString()
  employeeId: string;

  @IsEnum(ReviewPeriodEnum)
  reviewPeriod: ReviewPeriodEnum;

  @IsDateString()
  reviewDate: string;

  @IsString()
  reviewerId: string;

  @IsString()
  departmentId: string;

  @IsString()
  positionId: string;

  @ValidateNested()
  @Type(() => EmployeeSnapshotDto)
  employeeSnapshot: EmployeeSnapshotDto;

  @ValidateNested()
  @Type(() => AttendanceSummaryDto)
  attendanceSummary: AttendanceSummaryDto;

  @ValidateNested()
  @Type(() => LeaveSummaryDto)
  leaveSummary: LeaveSummaryDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingDto)
  ratings: RatingDto[];

  @IsNumber()
  overallRating: number;

  @IsNumber()
  taskCompletionRate: number;

  @IsNumber()
  wellBeingScore: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  newCertifications: CertificationDto[];

  @ValidateNested()
  @Type(() => SalaryAtReviewDto)
  salaryAtReview: SalaryAtReviewDto;

  @IsNumber()
  marketBenchmark: number;

  @IsNumber()
  marketDifference: number;

  @IsString()
  managerComments: string;

  @IsString()
  hrComments: string;

  @IsEnum(RecommendedActionEnum)
  recommendedAction: RecommendedActionEnum;

  @IsPositive()
  incrementPercentage: number;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}
