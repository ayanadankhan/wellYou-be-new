import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { DepartmentStatus } from '../entities/department.entity';
import { Types } from 'mongoose';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'IT001' })
  @IsString()
  @IsNotEmpty()
  departmentCode: string;

  @ApiProperty({ example: 'Information Technology' })
  @IsString()
  @IsNotEmpty()
  departmentName: string;

  @ApiProperty({ example: 'Handles all IT operations', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  parentDepartmentId?: Types.ObjectId;

  @ApiProperty({ example: '523e4567-e89b-12d3-a456-426614174004', required: false })
  @IsString()
  @IsOptional()
  departmentHeadId?: Types.ObjectId;

  @ApiProperty({ example: 500000.00 })
  @IsNumber()
  @IsNotEmpty()
  budgetAllocated: number;

  @ApiProperty({ example: 'CC-IT-001' })
  @IsString()
  @IsNotEmpty()
  costCenterCode: string;

  @ApiProperty({ example: '2020-03-01' })
  @IsDateString()
  @IsNotEmpty()
  establishedDate: Date;

  @ApiProperty({ enum: DepartmentStatus, example: DepartmentStatus.ACTIVE, default: DepartmentStatus.ACTIVE })
  @IsEnum(DepartmentStatus)
  @IsNotEmpty()
  status: DepartmentStatus = DepartmentStatus.ACTIVE;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;
}