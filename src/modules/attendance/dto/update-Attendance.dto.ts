// src/attendance/dto/update-Attendance.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsDateString, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAttendanceDto } from './create-Attendance.dto';

export class UpdateAttendanceDto extends PartialType(CreateAttendanceDto) {
  @ApiProperty({ description: 'Check-out time', example: '2025-01-15T17:30:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiProperty({ description: 'Total working hours', example: 8.5, required: false })
  @IsOptional()
  @IsNumber()
  totalHours?: number;

  @ApiProperty({ description: 'Attendance status', example: 'Present', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Auto checkout flag', example: false, required: false })
  @IsOptional()
  isAutoCheckout?: boolean;
}