// src/attendance/dto/create-bulk-attendance.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsDateString, IsBoolean, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBulkAttendanceDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty({
    description: 'An array of employee IDs for whom to create attendance records.',
    example: ['60c72b2f9b1d8c001c8e4a1b', '60c72b2f9b1d8c001c8e4a1c'],
  })
  employeeIds: string[];

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'The manual check-in time for all employees.',
    required: false,
    example: '2025-08-21T09:00:00.000Z',
  })
  checkInTime?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'The manual check-out time for all employees.',
    required: false,
    example: '2025-08-21T17:00:00.000Z',
  })
  checkOutTime?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Additional remarks for the attendance record.',
    required: false,
    example: 'Bulk attendance for team meeting.',
  })
  remarks?: string;
  
  // This flag ensures manual records are identifiable.
  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'A flag to indicate if the attendance record was manually created.',
    required: false,
    example: true,
  })
  isManual: boolean = true;
}