import { 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  IsDateString, 
  IsMongoId,
  IsIn,
  IsNumber,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs for nested objects
export class LeaveDetailsDto {
  @IsOptional()
  @IsString()
  leaveType?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  from?: Date;

  @IsOptional()
  @IsDateString()
  to?: Date;

  @IsOptional()
  @IsNumber()
  totalHour?: number;
}

export class TimeOffDetailsDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  fromHour?: string; // e.g., "14:00"

  @IsOptional()
  @IsString()
  toHour?: string;

  @IsOptional()
  @IsNumber()
  totalHour?: number;
}

export class OvertimeDetailsDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  fromHour?: string;

  @IsOptional()
  @IsString()
  toHour?: string;

  @IsOptional()
  @IsNumber()
  totalHour?: number;
}

export class WorkflowDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: string = 'pending';

  @IsOptional()
  @IsString()
  actionBy?: string;

  @IsOptional()
  @IsDateString()
  actionDate?: Date;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsObject()
  modifications?: Object;
}

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsMongoId()
  employeeId: string;

  @IsNotEmpty()
  @IsIn(['leave', 'timeOff', 'overtime'])
  type: string;

  // Note: appliedDate will be auto-generated in backend, no need to include in DTO

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LeaveDetailsDto)
  leaveDetails?: LeaveDetailsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TimeOffDetailsDto)
  timeOffDetails?: TimeOffDetailsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OvertimeDetailsDto)
  overtimeDetails?: OvertimeDetailsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkflowDto)
  workflow?: WorkflowDto;
}