// src/attendance/dto/update-Attendance.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsDateString, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAttendanceDto } from './create-Attendance.dto';

export class UpdateAttendanceDto extends PartialType(CreateAttendanceDto) {
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @IsOptional()
  @IsNumber()
  totalHours?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  isAutoCheckout?: boolean;
}