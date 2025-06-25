// src/attendance/dto/create-Attendance.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttendanceDto {
  @ApiProperty({ description: 'Employee ID', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Check-in time', example: '2025-01-15T09:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiProperty({ description: 'Remarks', example: 'Late due to traffic', required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}