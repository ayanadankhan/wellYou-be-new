import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DepartmentStatus } from '../entities/department.entity';
import { Types } from 'mongoose';
import { GetApiDto } from '@/modules/shared/dto';

export class GetDepartmentDto  extends GetApiDto {
  @ApiProperty({ example: 'IT001', required: false })
  @IsString()
  @IsOptional()
  departmentCode?: string;

  @ApiProperty({ example: 'Information Technology', required: false })
  @IsString()
  @IsOptional()
  departmentName?: string;

  @ApiProperty({ example: 'Handles all IT operations', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  parentDepartmentId?: Types.ObjectId;

  @ApiProperty({ example: '523e4567-e89b-12d3-a456-426614174004', required: false })
  @IsOptional()
  departmentHeadId?: Types.ObjectId;

  @ApiProperty({ example: 500000.00, required: false })
  @IsNumber()
  @IsOptional()
  budgetAllocated?: number;

  @ApiProperty({ example: 'CC-IT-001', required: false })
  @IsString()
  @IsOptional()
  costCenterCode?: string;

  @ApiProperty({ example: '2020-03-01', required: false })
  @IsDateString()
  @IsOptional()
  establishedDate?: Date;

  @ApiProperty({ enum: DepartmentStatus, example: DepartmentStatus.ACTIVE, required: false })
  @IsEnum(DepartmentStatus)
  @IsOptional()
  status?: DepartmentStatus;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;

   constructor() {
    super();
    this.sb = 'title';
    this.sd = '1';  
   }
}
