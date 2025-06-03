
"""
NestJS Leave Management Module Generator for Mongoose
Professional code generator for HRM Leave Management System
Author: HRM System Generator
Version: 1.0.0
"""

import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import argparse

# Configure professional logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('leave_module_generator.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('LeaveModuleGenerator')

class NestJSLeaveModuleGenerator:
    """Professional NestJS Leave Management Module Generator for Mongoose"""
    
    def __init__(self, output_dir: str = "./src/modules/leave"):
        self.output_dir = Path(output_dir)
        self.module_name = "leave"
        self.entities = ["LeaveType", "EmployeeBalance", "LeaveRequest", "CompanySetting"]
        
        logger.info(f"Initializing Leave Module Generator with output directory: {output_dir}")
        
    def _write_file(self, filepath: Path, content: str) -> None:
        """Write content to a file with error handling"""
        try:
            filepath.parent.mkdir(parents=True, exist_ok=True)
            with filepath.open('w', encoding='utf-8') as f:
                f.write(content)
            logger.info(f"Generated file: {filepath}")
        except Exception as e:
            logger.error(f"Error writing file {filepath}: {str(e)}")
            raise

    def create_directory_structure(self) -> None:
        """Create the directory structure for the leave module"""
        try:
            directories = [
                self.output_dir,
                self.output_dir / "schemas",
                self.output_dir / "dto",
                self.output_dir / "dto/create",
                self.output_dir / "dto/update",
                self.output_dir / "dto/get",
                self.output_dir / "controllers",
                self.output_dir / "services"
            ]
            
            for directory in directories:
                directory.mkdir(parents=True, exist_ok=True)
                logger.info(f"Created directory: {directory}")
                
        except Exception as e:
            logger.error(f"Error creating directory structure: {str(e)}")
            raise
    
    def generate_schemas(self) -> None:
        """Generate Mongoose schema files"""
        logger.info("Generating Mongoose schema files...")
        
        # Leave Type Schema
        leave_type_schema = '''import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export interface LeaveRules {
  requiresApproval: boolean;
  minNotice: number;
  maxConsecutive: number;
  isPaid: boolean;
  needsDocument: boolean;
}

@Schema({ timestamps: true })
export class LeaveType extends Document {
  @ApiProperty({ description: 'Unique identifier' })
  _id: string;

  @ApiProperty({ description: 'Leave type name' })
  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Leave type code' })
  @Prop({ type: String, required: true, unique: true, trim: true, maxlength: 10 })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Yearly allocation in days' })
  @Prop({ type: Number, required: true, min: 0 })
  @IsNumber()
  yearlyAllocation: number;

  @ApiProperty({ description: 'Carry forward days allowed' })
  @Prop({ type: Number, default: 0, min: 0 })
  @IsNumber()
  carryForward: number;

  @ApiProperty({ description: 'Leave rules configuration' })
  @Prop({ type: Object, default: {
    requiresApproval: true,
    minNotice: 1,
    maxConsecutive: 30,
    isPaid: true,
    needsDocument: false
  }})
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  rules: LeaveRules;

  @ApiProperty({ description: 'Active status' })
  @Prop({ type: Boolean, default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Company identifier' })
  @Prop({ type: String, required: true, index: true })
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);
LeaveTypeSchema.index({ companyId: 1, code: 1, isActive: 1 });
'''
        
        # Employee Balance Schema
        employee_balance_schema = '''import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { LeaveType } from './leave-type.schema';

@Schema({ timestamps: { createdAt: false, updatedAt: true } })
export class EmployeeBalance extends Document {
  @ApiProperty({ description: 'Unique identifier' })
  _id: string;

  @ApiProperty({ description: 'Employee identifier' })
  @Prop({ type: String, required: true, index: true })
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Leave type identifier' })
  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true })
  @IsNotEmpty()
  @IsString()
  leaveTypeId: string | LeaveType;

  @ApiProperty({ description: 'Balance year' })
  @Prop({ type: Number, required: true, min: 2020 })
  @IsNumber()
  @Min(2020)
  year: number;

  @ApiProperty({ description: 'Allocated days' })
  @Prop({ type: Number, required: true, min: 0 })
  @IsNumber()
  @Min(0)
  allocated: number;

  @ApiProperty({ description: 'Used days' })
  @Prop({ type: Number, default: 0, min: 0 })
  @IsNumber()
  @Min(0)
  used: number;

  @ApiProperty({ description: 'Pending days' })
  @Prop({ type: Number, default: 0, min: 0 })
  @IsNumber()
  @Min(0)
  pending: number;

  @ApiProperty({ description: 'Available days (computed)' })
  get available(): number {
    return this.allocated - this.used - this.pending;
  }

  @ApiProperty({ description: 'Company identifier' })
  @Prop({ type: String, required: true, index: true })
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const EmployeeBalanceSchema = SchemaFactory.createForClass(EmployeeBalance);
EmployeeBalanceSchema.index({ employeeId: 1, year: 1 });
EmployeeBalanceSchema.index({ companyId: 1, year: 1 });
'''
        
        # Leave Request Schema
        leave_request_schema = '''import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsDate, 
  IsArray, 
  IsEnum, 
  ValidateNested, 
  Min 
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveType } from './leave-type.schema';

export enum LeaveRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface LeaveApproval {
  approverId: string;
  status: ApprovalStatus;
  comments?: string;
  actionAt?: Date;
}

@Schema({ timestamps: true })
export class LeaveRequest extends Document {
  @ApiProperty({ description: 'Unique identifier' })
  _id: string;

  @ApiProperty({ description: 'Employee identifier' })
  @Prop({ type: String, required: true, index: true })
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Leave type identifier' })
  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true })
  @IsNotEmpty()
  @IsString()
  leaveTypeId: string | LeaveType;

  @ApiProperty({ description: 'Leave start date' })
  @Prop({ type: Date, required: true })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: 'Leave end date' })
  @Prop({ type: Date, required: true })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ description: 'Number of working days' })
  @Prop({ type: Number, required: true, min: 0.5 })
  @IsNumber()
  @Min(0.5)
  days: number;

  @ApiProperty({ description: 'Leave reason' })
  @Prop({ type: String, required: true, trim: true })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Request status', enum: LeaveRequestStatus })
  @Prop({ 
    type: String, 
    enum: LeaveRequestStatus, 
    default: LeaveRequestStatus.PENDING 
  })
  @IsEnum(LeaveRequestStatus)
  status: LeaveRequestStatus;

  @ApiProperty({ description: 'Approval chain' })
  @Prop({ type: [{ 
    approverId: String, 
    status: { type: String, enum: ApprovalStatus }, 
    comments: String, 
    actionAt: Date 
  }], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  approvals: LeaveApproval[];

  @ApiProperty({ description: 'Document URLs' })
  @Prop({ type: [String], default: [] })
  @IsArray()
  documents: string[];

  @ApiProperty({ description: 'Company identifier' })
  @Prop({ type: String, required: true, index: true })
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);
LeaveRequestSchema.index({ employeeId: 1, status: 1 });
LeaveRequestSchema.index({ companyId: 1, startDate: 1 });

LeaveRequestSchema.pre('save', function(next) {
  if (this.startDate > this.endDate) {
    return next(new Error('Start date cannot be after end date'));
  }
  next();
});
'''
        
        # Company Settings Schema
        company_settings_schema = '''import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, IsObject, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export interface CompanyHoliday {
  date: Date;
  name: string;
}

export interface LeavePolicies {
  financialYearStart: string;
  probationPeriod: number;
  maxTeamLeave: number;
  autoApprovalLimit: number;
}

@Schema({ timestamps: { createdAt: false, updatedAt: true } })
export class CompanySetting extends Document {
  @ApiProperty({ description: 'Unique identifier' })
  _id: string;

  @ApiProperty({ description: 'Company identifier' })
  @Prop({ type: String, required: true, unique: true, index: true })
  @IsNotEmpty()
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Working days of the week' })
  @Prop({ type: [String], default: ['MON', 'TUE', 'WED', 'THU', 'FRI'] })
  @IsArray()
  workingDays: string[];

  @ApiProperty({ description: 'Company holidays' })
  @Prop({ type: [{ date: Date, name: String }], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  holidays: CompanyHoliday[];

  @ApiProperty({ description: 'Leave policies configuration' })
  @Prop({ 
    type: Object, 
    default: {
      financialYearStart: '04-01',
      probationPeriod: 90,
      maxTeamLeave: 2,
      autoApprovalLimit: 1
    } 
  })
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  policies: LeavePolicies;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const CompanySettingSchema = SchemaFactory.createForClass(CompanySetting);
CompanySettingSchema.index({ companyId: 1 });
'''
        
        # Write schema files
        schemas = {
            'leave-type.schema.ts': leave_type_schema,
            'employee-balance.schema.ts': employee_balance_schema,
            'leave-request.schema.ts': leave_request_schema,
            'company-setting.schema.ts': company_settings_schema
        }
        
        for filename, content in schemas.items():
            self._write_file(self.output_dir / "schemas" / filename, content)
        
        # Create index file for schemas
        index_content = '''export { LeaveType, LeaveTypeSchema } from './leave-type.schema';
export { EmployeeBalance, EmployeeBalanceSchema } from './employee-balance.schema';
export { LeaveRequest, LeaveRequestSchema, LeaveRequestStatus, ApprovalStatus } from './leave-request.schema';
export { CompanySetting, CompanySettingSchema } from './company-setting.schema';
'''
        self._write_file(self.output_dir / "schemas" / "index.ts", index_content)
        
        logger.info("Mongoose schema files generated successfully")
    
    def generate_dtos(self) -> None:
        """Generate all DTO files for create, update, and get operations"""
        logger.info("Generating DTO files...")
        
        # CREATE DTOs
        create_leave_type_dto = '''import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsBoolean, 
  IsObject, 
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveRules } from '../../schemas';

export class CreateLeaveTypeDto {
  @ApiProperty({ 
    description: 'Leave type name',
    example: 'Annual Leave',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    description: 'Leave type code',
    example: 'AL',
    minLength: 2,
    maxLength: 10
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  code: string;

  @ApiProperty({ 
    description: 'Yearly allocation in days',
    example: 21,
    minimum: 0,
    maximum: 365
  })
  @IsNumber()
  @Min(0)
  @Max(365)
  @Type(() => Number)
  yearlyAllocation: number;

  @ApiProperty({ 
    description: 'Carry forward days allowed',
    example: 5,
    minimum: 0,
    maximum: 30
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  @Type(() => Number)
  carryForward?: number;

  @ApiProperty({ 
    description: 'Leave rules configuration',
    example: {
      requiresApproval: true,
      minNotice: 1,
      maxConsecutive: 30,
      isPaid: true,
      needsDocument: false
    }
  })
  @IsOptional()
  @IsObject()
  rules?: LeaveRules;

  @ApiProperty({ 
    description: 'Active status',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
'''
        
        create_leave_request_dto = '''import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsDate, 
  IsArray, 
  IsOptional,
  MinLength,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeaveRequestDto {
  @ApiProperty({ 
    description: 'Leave type identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsString()
  leaveTypeId: string;

  @ApiProperty({ 
    description: 'Leave start date',
    example: '2025-06-15'
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ 
    description: 'Leave end date',
    example: '2025-06-17'
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ 
    description: 'Number of working days',
    example: 3,
    minimum: 0.5
  })
  @IsNumber()
  @Min(0.5)
  @Type(() => Number)
  days: number;

  @ApiProperty({ 
    description: 'Leave reason',
    example: 'Family vacation',
    minLength: 5
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  reason: string;

  @ApiProperty({ 
    description: 'Document URLs',
    example: ['https://example.com/doc1.pdf'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];
}
'''
        
        # UPDATE DTOs
        update_leave_type_dto = '''import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLeaveTypeDto } from '../create/create-leave-type.dto';

export class UpdateLeaveTypeDto extends PartialType(CreateLeaveTypeDto) {}
'''
        
        update_leave_request_dto = '''import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveRequestStatus, ApprovalStatus } from '../../schemas';

export class UpdateLeaveApprovalDto {
  @ApiProperty({ description: 'Approver ID' })
  @IsString()
  approverId: string;

  @ApiProperty({ description: 'Approval status', enum: ApprovalStatus })
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @ApiProperty({ description: 'Approval comments', required: false })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({ description: 'Action timestamp', required: false })
  @IsOptional()
  @Type(() => Date)
  actionAt?: Date;
}

export class UpdateLeaveRequestDto {
  @ApiProperty({ 
    description: 'Request status', 
    enum: LeaveRequestStatus,
    required: false 
  })
  @IsOptional()
  @IsEnum(LeaveRequestStatus)
  status?: LeaveRequestStatus;

  @ApiProperty({ 
    description: 'Updated reason',
    required: false
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ 
    description: 'Document URLs',
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiProperty({ 
    description: 'Approval updates',
    type: [UpdateLeaveApprovalDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLeaveApprovalDto)
  approvals?: UpdateLeaveApprovalDto[];
}
'''
        
        # GET DTOs
        get_leave_balance_dto = '''import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class GetLeaveBalanceDto {
  @ApiProperty({ description: 'Balance ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Employee ID' })
  @Expose()
  employeeId: string;

  @ApiProperty({ description: 'Leave type ID' })
  @Expose()
  leaveTypeId: string;

  @ApiProperty({ description: 'Year' })
  @Expose()
  year: number;

  @ApiProperty({ description: 'Allocated days' })
  @Expose()
  @Type(() => Number)
  allocated: number;

  @ApiProperty({ description: 'Used days' })
  @Expose()
  @Type(() => Number)
  used: number;

  @ApiProperty({ description: 'Pending days' })
  @Expose()
  @Type(() => Number)
  pending: number;

  @ApiProperty({ description: 'Available days' })
  @Expose()
  @Type(() => Number)
  available: number;

  @ApiProperty({ description: 'Leave type details' })
  @Expose()
  leaveType: {
    name: string;
    code: string;
  };

  @ApiProperty({ description: 'Last updated' })
  @Expose()
  updatedAt: Date;
}
'''
        
        query_leave_request_dto = '''import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';
import { LeaveRequestStatus } from '../../schemas';

export class QueryLeaveRequestDto {
  @ApiPropertyOptional({ description: 'Employee ID filter' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Leave type ID filter' })
  @IsOptional()
  @IsString()
  leaveTypeId?: string;

  @ApiPropertyOptional({ 
    description: 'Status filter', 
    enum: LeaveRequestStatus 
  })
  @IsOptional()
  @IsEnum(LeaveRequestStatus)
  status?: LeaveRequestStatus;

  @ApiPropertyOptional({ description: 'Start date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Start date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => Math.min(parseInt(value) || 10, 100))
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'createdAt' })
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
'''
        
        # Write DTO files
        create_dtos = {
            'create-leave-type.dto.ts': create_leave_type_dto,
            'create-leave-request.dto.ts': create_leave_request_dto
        }
        
        update_dtos = {
            'update-leave-type.dto.ts': update_leave_type_dto,
            'update-leave-request.dto.ts': update_leave_request_dto
        }
        
        get_dtos = {
            'get-leave-balance.dto.ts': get_leave_balance_dto,
            'query-leave-request.dto.ts': query_leave_request_dto
        }
        
        for filename, content in create_dtos.items():
            self._write_file(self.output_dir / "dto/create" / filename, content)
            
        for filename, content in update_dtos.items():
            self._write_file(self.output_dir / "dto/update" / filename, content)
            
        for filename, content in get_dtos.items():
            self._write_file(self.output_dir / "dto/get" / filename, content)
        
        # Create DTO index files
        create_index = '''export { CreateLeaveTypeDto } from './create-leave-type.dto';
export { CreateLeaveRequestDto } from './create-leave-request.dto';
'''
        
        update_index = '''export { UpdateLeaveTypeDto } from './update-leave-type.dto';
export { UpdateLeaveRequestDto, UpdateLeaveApprovalDto } from './update-leave-request.dto';
'''
        
        get_index = '''export { GetLeaveBalanceDto } from './get-leave-balance.dto';
export { QueryLeaveRequestDto } from './query-leave-request.dto';
'''
        
        self._write_file(self.output_dir / "dto/create" / "index.ts", create_index)
        self._write_file(self.output_dir / "dto/update" / "index.ts", update_index)
        self._write_file(self.output_dir / "dto/get" / "index.ts", get_index)
        
        main_dto_index = '''export * from './create';
export * from './update';
export * from './get';
'''
        self._write_file(self.output_dir / "dto" / "index.ts", main_dto_index)
        
        logger.info("DTO files generated successfully")
    
    def generate_services(self) -> None:
        """Generate service files with Mongoose-compatible business logic"""
        logger.info("Generating service files...")
        
        # Leave Request Service
        leave_request_service = '''import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  LeaveRequest, 
  LeaveRequestDocument,
  EmployeeBalance, 
  EmployeeBalanceDocument,
  LeaveType,
  LeaveTypeDocument,
  LeaveRequestStatus,
  ApprovalStatus
} from '../schemas';
import { 
  CreateLeaveRequestDto, 
  UpdateLeaveRequestDto, 
  QueryLeaveRequestDto 
} from '../dto';

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class LeaveRequestService {
  private readonly logger = new Logger(LeaveRequestService.name);

  constructor(
    @InjectModel(LeaveRequest.name) private readonly leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(EmployeeBalance.name) private readonly employeeBalanceModel: Model<EmployeeBalanceDocument>,
    @InjectModel(LeaveType.name) private readonly leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  async create(
    employeeId: string,
    createLeaveRequestDto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    this.logger.log(`Creating leave request for employee: ${employeeId}`);

    try {
      // Validate leave type exists and is active
      const leaveType = await this.leaveTypeModel.findOne({ 
        _id: createLeaveRequestDto.leaveTypeId, 
        companyId: createLeaveRequestDto.companyId,
        isActive: true 
      }).lean();

      if (!leaveType) {
        throw new NotFoundException('Leave type not found or inactive');
      }

      // Validate dates
      this.validateLeaveDates(createLeaveRequestDto.startDate, createLeaveRequestDto.endDate);

      // Check leave balance
      await this.validateLeaveBalance(
        employeeId, 
        createLeaveRequestDto.leaveTypeId, 
        createLeaveRequestDto.days,
        new Date().getFullYear()
      );

      // Check business rules
      await this.validateBusinessRules(employeeId, createLeaveRequestDto, leaveType);

      // Create leave request
      const leaveRequest = new this.leaveRequestModel({
        ...createLeaveRequestDto,
        employeeId,
        status: LeaveRequestStatus.PENDING,
        approvals: await this.generateApprovalChain(employeeId, createLeaveRequestDto.companyId)
      });

      const savedRequest = await leaveRequest.save();

      // Update pending balance
      await this.updatePendingBalance(employeeId, createLeaveRequestDto.leaveTypeId, createLeaveRequestDto.days, 'add');

      this.logger.log(`Leave request created successfully: ${savedRequest._id}`);
      return savedRequest;

    } catch (error) {
      this.logger.error(`Error creating leave request: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(query: QueryLeaveRequestDto): Promise<PaginationResult<LeaveRequest>> {
    this.logger.log('Fetching leave requests with filters', { query });

    try {
      const { employeeId, leaveTypeId, status, startDateFrom, startDateTo, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

      const filter: any = {};
      if (employeeId) filter.employeeId = employeeId;
      if (leaveTypeId) filter.leaveTypeId = leaveTypeId;
      if (status) filter.status = status;
      if (query.companyId) filter.companyId = query.companyId;
      if (startDateFrom || startDateTo) {
        filter.startDate = {};
        if (startDateFrom) filter.startDate.$gte = new Date(startDateFrom);
        if (startDateTo) filter.startDate.$lte = new Date(startDateTo);
      }

      const sort = { [sortBy]: sortOrder === 'ASC' ? 1 : -1 };

      const [data, total] = await Promise.all([
        this.leaveRequestModel
          .find(filter)
          .populate('leaveTypeId')
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        this.leaveRequestModel.countDocuments(filter)
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      this.logger.error(`Error fetching leave requests: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch leave requests');
    }
  }

  async findOne(id: string, companyId: string): Promise<LeaveRequest> {
    this.logger.log(`Fetching leave request: ${id}`);

    const leaveRequest = await this.leaveRequestModel
      .findOne({ _id: id, companyId })
      .populate('leaveTypeId')
      .lean();

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    return leaveRequest;
  }

  async update(
    id: string, 
    companyId: string,
    updateLeaveRequestDto: UpdateLeaveRequestDto
  ): Promise<LeaveRequest> {
    this.logger.log(`Updating leave request: ${id}`);

    try {
      const leaveRequest = await this.leaveRequestModel
        .findOne({ _id: id, companyId })
        .populate('leaveTypeId');

      if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
      }

      // Validate update permissions
      this.validateUpdatePermissions(leaveRequest, updateLeaveRequestDto);

      // Handle status changes
      if (updateLeaveRequestDto.status && updateLeaveRequestDto.status !== leaveRequest.status) {
        await this.handleStatusChange(leaveRequest, updateLeaveRequestDto.status);
      }

      // Update the request
      Object.assign(leaveRequest, updateLeaveRequestDto);
      const updatedRequest = await leaveRequest.save();

      this.logger.log(`Leave request updated successfully: ${id}`);
      return updatedRequest;

    } catch (error) {
      this.logger.error(`Error updating leave request: ${error.message}`, error.stack);
      throw error;
    }
  }

  async approve(
    id: string, 
    approverId: string, 
    companyId: string,
    comments?: string
  ): Promise<LeaveRequest> {
    this.logger.log(`Approving leave request: ${id} by ${approverId}`);

    try {
      const leaveRequest = await this.leaveRequestModel
        .findOne({ _id: id, companyId })
        .populate('leaveTypeId');

      if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
      }

      if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be approved');
      }

      // Update approval chain
      const updatedApprovals = leaveRequest.approvals.map((approval: LeaveApproval) => {
        if (approval.approverId === approverId && approval.status === ApprovalStatus.PENDING) {
          return {
            ...approval,
            status: ApprovalStatus.APPROVED,
            comments,
            actionAt: new Date()
          };
        }
        return approval;
      });

      // Check if all approvals are complete
      const allApproved = updatedApprovals.every(
        (approval: LeaveApproval) => approval.status === ApprovalStatus.APPROVED
      );

      leaveRequest.approvals = updatedApprovals;
      
      if (allApproved) {
        leaveRequest.status = LeaveRequestStatus.APPROVED;
        await this.finalizeLeaveBalance(leaveRequest);
      }

      const result = await leaveRequest.save();
      this.logger.log(`Leave request approved: ${id}`);
      
      return result;

    } catch (error) {
      this.logger.error(`Error approving leave request: ${error.message}`, error.stack);
      throw error;
    }
  }

  async reject(
    id: string, 
    approverId: string, 
    companyId: string,
    comments: string
  ): Promise<LeaveRequest> {
    this.logger.log(`Rejecting leave request: ${id} by ${approverId}`);

    try {
      const leaveRequest = await this.leaveRequestModel
        .findOne({ _id: id, companyId })
        .populate('leaveTypeId');

      if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
      }

      if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be rejected');
      }

      // Update approval chain
      const updatedApprovals = leaveRequest.approvals.map((approval: LeaveApproval) => {
        if (approval.approverId === approverId && approval.status === ApprovalStatus.PENDING) {
          return {
            ...approval,
            status: ApprovalStatus.REJECTED,
            comments,
            actionAt: new Date()
          };
        }
        return approval;
      });

      leaveRequest.approvals = updatedApprovals;
      leaveRequest.status = LeaveRequestStatus.REJECTED;

      await this.updatePendingBalance(
        leaveRequest.employeeId, 
        leaveRequest.leaveTypeId, 
        leaveRequest.days, 
        'subtract'
      );

      const result = await leaveRequest.save();
      this.logger.log(`Leave request rejected: ${id}`);
      
      return result;

    } catch (error) {
      this.logger.error(`Error rejecting leave request: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancel(id: string, employeeId: string, companyId: string): Promise<LeaveRequest> {
    this.logger.log(`Cancelling leave request: ${id} by employee: ${employeeId}`);

    try {
      const leaveRequest = await this.leaveRequestModel
        .findOne({ _id: id, companyId })
        .populate('leaveTypeId');

      if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
      }

      if (leaveRequest.employeeId !== employeeId) {
        throw new ForbiddenException('You can only cancel your own leave requests');
      }

      if (![LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED].includes(leaveRequest.status)) {
        throw new BadRequestException('Only pending or approved requests can be cancelled');
      }

      if (leaveRequest.startDate <= new Date()) {
        throw new BadRequestException('Cannot cancel leave that has already started');
      }

      leaveRequest.status = LeaveRequestStatus.CANCELLED;

      if (leaveRequest.status === LeaveRequestStatus.PENDING) {
        await this.updatePendingBalance(employeeId, leaveRequest.leaveTypeId, leaveRequest.days, 'subtract');
      } else if (leaveRequest.status === LeaveRequestStatus.APPROVED) {
        await this.revertApprovedLeave(leaveRequest);
      }

      const result = await leaveRequest.save();
      this.logger.log(`Leave request cancelled: ${id}`);
      
      return result;

    } catch (error) {
      this.logger.error(`Error cancelling leave request: ${error.message}`, error.stack);
      throw error;
    }
  }

  private validateLeaveDates(startDate: Date, endDate: Date): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Leave start date cannot be in the past');
    }

    if (startDate > endDate) {
      throw new BadRequestException('Leave start date cannot be after end date');
    }
  }

  private async validateLeaveBalance(
    employeeId: string, 
    leaveTypeId: string, 
    requestedDays: number,
    year: number
  ): Promise<void> {
    const balance = await this.employeeBalanceModel.findOne({
      employeeId, 
      leaveTypeId, 
      year 
    }).lean();

    if (!balance) {
      throw new NotFoundException('Leave balance not found for employee');
    }

    const availableDays = balance.allocated - balance.used - balance.pending;
    
    if (availableDays < requestedDays) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${availableDays}, Requested: ${requestedDays}`
      );
    }
  }

  private async validateBusinessRules(
    employeeId: string,
    createLeaveRequestDto: CreateLeaveRequestDto,
    leaveType: LeaveType
  ): Promise<void> {
    const rules = leaveType.rules;

    const daysDifference = Math.ceil(
      (createLeaveRequestDto.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference < rules.minNotice) {
      throw new BadRequestException(
        `Minimum notice period of ${rules.minNotice} days required`
      );
    }

    if (createLeaveRequestDto.days > rules.maxConsecutive) {
      throw new BadRequestException(
        `Maximum consecutive leave days allowed: ${rules.maxConsecutive}`
      );
    }

    const overlappingRequests = await this.leaveRequestModel.find({
      employeeId,
      status: LeaveRequestStatus.APPROVED,
      $or: [
        { 
          startDate: { $lte: createLeaveRequestDto.endDate },
          endDate: { $gte: createLeaveRequestDto.startDate }
        }
      ]
    }).lean();

    if (overlappingRequests.length > 0) {
      throw new ConflictException('Overlapping leave requests found');
    }
  }

  private async generateApprovalChain(employeeId: string, companyId: string): Promise<LeaveApproval[]> {
    return [
      {
        approverId: 'manager-id', // Replace with actual logic to fetch manager ID
        status: ApprovalStatus.PENDING,
        comments: undefined,
        actionAt: undefined
      }
    ];
  }

  private async updatePendingBalance(
    employeeId: string, 
    leaveTypeId: string, 
    days: number, 
    operation: 'add' | 'subtract'
  ): Promise<void> {
    const balance = await this.employeeBalanceModel.findOne({
      employeeId, 
      leaveTypeId, 
      year: new Date().getFullYear()
    });

    if (balance) {
      balance.pending = operation === 'add' 
        ? balance.pending + days 
        : balance.pending - days;
      
      await balance.save();
    }
  }

  private async finalizeLeaveBalance(leaveRequest: LeaveRequestDocument): Promise<void> {
    const balance = await this.employeeBalanceModel.findOne({
      employeeId: leaveRequest.employeeId, 
      leaveTypeId: leaveRequest.leaveTypeId, 
      year: new Date().getFullYear()
    });

    if (balance) {
      balance.pending -= leaveRequest.days;
      balance.used += leaveRequest.days;
      await balance.save();
    }
  }

  private async revertApprovedLeave(leaveRequest: LeaveRequestDocument): Promise<void> {
    const balance = await this.employeeBalanceModel.findOne({
      employeeId: leaveRequest.employeeId, 
      leaveTypeId: leaveRequest.leaveTypeId, 
      year: new Date().getFullYear()
    });

    if (balance) {
      balance.used -= leaveRequest.days;
      await balance.save();
    }
  }

  private validateUpdatePermissions(
    leaveRequest: LeaveRequest, 
    updateDto: UpdateLeaveRequestDto
  ): void {
    if (leaveRequest.status !== LeaveRequestStatus.PENDING && updateDto.status) {
      throw new BadRequestException('Cannot modify non-pending requests');
    }

    if (leaveRequest.startDate <= new Date() && Object.keys(updateDto).length > 0) {
      throw new BadRequestException('Cannot modify leave requests that have already started');
    }
  }

  private async handleStatusChange(
    leaveRequest: LeaveRequest, 
    newStatus: LeaveRequestStatus
  ): Promise<void> {
    const oldStatus = leaveRequest.status;

    if (oldStatus === LeaveRequestStatus.PENDING && newStatus === LeaveRequestStatus.CANCELLED) {
      await this.updatePendingBalance(
        leaveRequest.employeeId, 
        leaveRequest.leaveTypeId, 
        leaveRequest.days, 
        'subtract'
      );
    }
  }
}
'''

        # Employee Balance Service
        employee_balance_service = '''import { 
  Injectable, 
  Logger, 
  NotFoundException,
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  EmployeeBalance, 
  EmployeeBalanceDocument,
  LeaveType,
  LeaveTypeDocument 
} from '../schemas';
import { GetLeaveBalanceDto } from '../dto';

@Injectable()
export class EmployeeBalanceService {
  private readonly logger = new Logger(EmployeeBalanceService.name);

  constructor(
    @InjectModel(EmployeeBalance.name) private readonly employeeBalanceModel: Model<EmployeeBalanceDocument>,
    @InjectModel(LeaveType.name) private readonly leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  async getEmployeeBalances(
    employeeId: string, 
    companyId: string,
    year?: number
  ): Promise<GetLeaveBalanceDto[]> {
    this.logger.log(`Fetching balances for employee: ${employeeId}, year: ${year || 'current'}`);

    const currentYear = year || new Date().getFullYear();

    try {
      const balances = await this.employeeBalanceModel
        .find({ employeeId, companyId, year: currentYear })
        .populate('leaveTypeId')
        .lean();

      return balances.map(balance => ({
        id: balance._id,
        employeeId: balance.employeeId,
        leaveTypeId: balance.leaveTypeId._id,
        year: balance.year,
        allocated: balance.allocated,
        used: balance.used,
        pending: balance.pending,
        available: balance.available,
        leaveType: {
          name: balance.leaveTypeId.name,
          code: balance.leaveTypeId.code
        },
        updatedAt: balance.updatedAt
      }));

    } catch (error) {
      this.logger.error(`Error fetching employee balances: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch employee balances');
    }
  }

  async initializeEmployeeBalances(
    employeeId: string, 
    companyId: string,
    year?: number
  ): Promise<EmployeeBalance[]> {
    this.logger.log(`Initializing balances for employee: ${employeeId}`);

    const currentYear = year || new Date().getFullYear();

    try {
      const leaveTypes = await this.leaveTypeModel.find({ companyId, isActive: true }).lean();
      const balances: EmployeeBalance[] = [];

      for (const leaveType of leaveTypes) {
        const existingBalance = await this.employeeBalanceModel.findOne({
          employeeId, 
          leaveTypeId: leaveType._id, 
          year: currentYear 
        });

        if (!existingBalance) {
          const balance = new this.employeeBalanceModel({
            employeeId,
            leaveTypeId: leaveType._id,
            year: currentYear,
            allocated: leaveType.yearlyAllocation,
            used: 0,
            pending: 0,
            companyId
          });

          const savedBalance = await balance.save();
          balances.push(savedBalance);
        }
      }

      this.logger.log(`Initialized ${balances.length} new balances for employee: ${employeeId}`);
      return balances;

    } catch (error) {
      this.logger.error(`Error initializing employee balances: ${error.message}`, error.stack);
      throw error;
    }
  }

  async adjustBalance(
    employeeId: string,
    leaveTypeId: string,
    companyId: string,
    adjustment: number,
    reason: string,
    year?: number
  ): Promise<EmployeeBalance> {
    this.logger.log(`Adjusting balance for employee: ${employeeId}, adjustment: ${adjustment}`);

    const currentYear = year || new Date().getFullYear();

    try {
      const balance = await this.employeeBalanceModel.findOne({
        employeeId, 
        leaveTypeId, 
        year: currentYear, 
        companyId 
      });

      if (!balance) {
        throw new NotFoundException('Employee balance not found');
      }

      balance.allocated += adjustment;

      if (balance.allocated < 0) {
        throw new BadRequestException('Balance cannot be negative after adjustment');
      }

      const updatedBalance = await balance.save();

      this.logger.log(`Balance adjusted successfully for employee: ${employeeId}`);
      return updatedBalance;

    } catch (error) {
      this.logger.error(`Error adjusting balance: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTeamBalances(
    teamMemberIds: string[],
    companyId: string,
    year?: number
  ): Promise<{ [employeeId: string]: GetLeaveBalanceDto[] }> {
    this.logger.log(`Fetching team balances for ${teamMemberIds.length} members`);

    const currentYear = year || new Date().getFullYear();
    const teamBalances: { [employeeId: string]: GetLeaveBalanceDto[] } = {};

    try {
      for (const employeeId of teamMemberIds) {
        teamBalances[employeeId] = await this.getEmployeeBalances(employeeId, companyId, currentYear);
      }

      return teamBalances;

    } catch (error) {
      this.logger.error(`Error fetching team balances: ${error.message}`, error.stack);
      throw error;
    }
  }
}
'''

        # Leave Type Service
        leave_type_service = '''import { 
  Injectable, 
  Logger, 
  NotFoundException,
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from '../schemas';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from '../dto';

@Injectable()
export class LeaveTypeService {
  private readonly logger = new Logger(LeaveTypeService.name);

  constructor(
    @InjectModel(LeaveType.name) private readonly leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  async create(createLeaveTypeDto: CreateLeaveTypeDto): Promise<LeaveType> {
    this.logger.log(`Creating leave type: ${createLeaveTypeDto.name}`);

    try {
      const existingLeaveType = await this.leaveTypeModel.findOne({
        code: createLeaveTypeDto.code, 
        companyId: createLeaveTypeDto.companyId 
      }).lean();

      if (existingLeaveType) {
        throw new ConflictException('Leave type code already exists for this company');
      }

      const leaveType = new this.leaveTypeModel(createLeaveTypeDto);
      const savedLeaveType = await leaveType.save();

      this.logger.log(`Leave type created successfully: ${savedLeaveType._id}`);
      return savedLeaveType;

    } catch (error) {
      this.logger.error(`Error creating leave type: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(companyId: string, includeInactive = false): Promise<LeaveType[]> {
    this.logger.log(`Fetching leave types for company: ${companyId}`);

    try {
      const filter: any = { companyId };
      
      if (!includeInactive) {
        filter.isActive = true;
      }

      const leaveTypes = await this.leaveTypeModel
        .find(filter)
        .sort({ name: 1 })
        .lean();

      return leaveTypes;

    } catch (error) {
      this.logger.error(`Error fetching leave types: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch leave types');
    }
  }

  async findOne(id: string, companyId: string): Promise<LeaveType> {
    this.logger.log(`Fetching leave type: ${id}`);

    const leaveType = await this.leaveTypeModel
      .findOne({ _id: id, companyId })
      .lean();

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    return leaveType;
  }

  async update(
    id: string, 
    companyId: string,
    updateLeaveTypeDto: UpdateLeaveTypeDto
  ): Promise<LeaveType> {
    this.logger.log(`Updating leave type: ${id}`);

    try {
      const leaveType = await this.leaveTypeModel.findOne({ _id: id, companyId });

      if (!leaveType) {
        throw new NotFoundException('Leave type not found');
      }

      if (updateLeaveTypeDto.code && updateLeaveTypeDto.code !== leaveType.code) {
        const existingLeaveType = await this.leaveTypeModel.findOne({
          code: updateLeaveTypeDto.code, 
          companyId,
          _id: { $ne: id }
        });

        if (existingLeaveType) {
          throw new ConflictException('Leave type code already exists for this company');
        }
      }

      Object.assign(leaveType, updateLeaveTypeDto);
      const updatedLeaveType = await leaveType.save();

      this.logger.log(`Leave type updated successfully: ${id}`);
      return updatedLeaveType;

    } catch (error) {
      this.logger.error(`Error updating leave type: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deactivate(id: string, companyId: string): Promise<LeaveType> {
    this.logger.log(`Deactivating leave type: ${id}`);

    try {
      const leaveType = await this.leaveTypeModel.findOne({ _id: id, companyId });

      if (!leaveType) {
        throw new NotFoundException('Leave type not found');
      }

      leaveType.isActive = false;
      const deactivatedLeaveType = await leaveType.save();

      this.logger.log(`Leave type deactivated successfully: ${id}`);
      return deactivatedLeaveType;

    } catch (error) {
      this.logger.error(`Error deactivating leave type: ${error.message}`, error.stack);
      throw error;
    }
  }
}
'''

        # Write service files
        services = {
            'leave-request.service.ts': leave_request_service,
            'employee-balance.service.ts': employee_balance_service,
            'leave-type.service.ts': leave_type_service
        }

        for filename, content in services.items():
            self._write_file(self.output_dir / "services" / filename, content)

        # Service index
        service_index = '''export { LeaveRequestService } from './leave-request.service';
export { EmployeeBalanceService } from './employee-balance.service';
export { LeaveTypeService } from './leave-type.service';
'''
        self._write_file(self.output_dir / "services" / "index.ts", service_index)

        logger.info("Service files generated successfully")
    
    def generate_controllers(self) -> None:
        """Generate controller files with API endpoints"""
        logger.info("Generating controller files...")
        
        # Leave Request Controller
        leave_request_controller = '''import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  HttpStatus,
  Req
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { LeaveRequestService } from '../services';
import {
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  QueryLeaveRequestDto
} from '../dto';
import { LeaveRequest } from '../schemas';
import { JwtAuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/constants/user-roles.enum';

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@ApiTags('Leave Requests')
@ApiBearerAuth()
@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestController {
  private readonly logger = new Logger(LeaveRequestController.name);

  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new leave request' })
  @ApiBody({ type: CreateLeaveRequestDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Leave request created successfully',
    type: LeaveRequest 
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  @ApiResponse({ status: 409, description: 'Insufficient balance or conflict' })
  async create(
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
    @Req() req: any
  ): Promise<LeaveRequest> {
    this.logger.log(`Creating leave request for employee: ${req.user.employeeId}`);
    
    return this.leaveRequestService.create(
      req.user.employeeId,
      {
        ...createLeaveRequestDto,
        companyId: req.user.companyId
      }
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all leave requests with filters' })
  @ApiQuery({ type: QueryLeaveRequestDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Leave requests retrieved successfully' 
  })
  async findAll(
    @Query() query: QueryLeaveRequestDto,
    @Req() req: any
  ): Promise<PaginationResult<LeaveRequest>> {
    this.logger.log(`Fetching leave requests with filters`, { query });

    return this.leaveRequestService.findAll({
      ...query,
      companyId: req.user.companyId
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific leave request by ID' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Leave request retrieved successfully',
    type: LeaveRequest 
  })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ): Promise<LeaveRequest> {
    this.logger.log(`Fetching leave request: ${id}`);
    
    return this.leaveRequestService.findOne(id, req.user.companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiBody({ type: UpdateLeaveRequestDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Leave request updated successfully',
    type: LeaveRequest 
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto,
    @Req() req: any
  ): Promise<LeaveRequest> {
    this.logger.log(`Updating leave request: ${id}`);
    
    return this.leaveRequestService.update(id, req.user.companyId, updateLeaveRequestDto);
  }

  @Patch(':id/approve')
  @Roles(UserRole.MANAGER, UserRole.HR)
  @ApiOperation({ summary: 'Approve a leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { comments: { type: 'string', nullable: true } } 
    } 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Leave request approved successfully',
    type: LeaveRequest 
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('comments') comments: string,
    @Req() req: any
  ): Promise<LeaveRequest> {
    this.logger.log(`Approving leave request: ${id} by ${req.user.employeeId}`);
    
    return this.leaveRequestService.approve(id, req.user.employeeId, req.user.companyId, comments);
  }

  @Patch(':id/reject')
  @Roles(UserRole.MANAGER, UserRole.HR)
  @ApiOperation({ summary: 'Reject a leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { comments: { type: 'string' } } 
    } 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Leave request rejected successfully',
    type: LeaveRequest 
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('comments') comments: string,
    @Req() req: any
  ): Promise<LeaveRequest> {
    this.logger.log(`Rejecting leave request: ${id} by ${req.user.employeeId}`);
    
    return this.leaveRequestService.reject(id, req.user.employeeId, req.user.companyId, comments);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Leave request cancelled successfully',
    type: LeaveRequest 
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your request' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ): Promise<LeaveRequest> {
    this.logger.log(`Cancelling leave request: ${id} by ${req.user.employeeId}`);
    
    return this.leaveRequestService.cancel(id, req.user.employeeId, req.user.companyId);
  }
}
'''

        # Employee Balance Controller
        employee_balance_controller = '''import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  HttpStatus,
  Req
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { EmployeeBalanceService } from '../services';
import { GetLeaveBalanceDto } from '../dto';
import { JwtAuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/constants/user-roles.enum';

@ApiTags('Employee Balances')
@ApiBearerAuth()
@Controller('employee-balances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeBalanceController {
  private readonly logger = new Logger(EmployeeBalanceController.name);

  constructor(private readonly employeeBalanceService: EmployeeBalanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get employee leave balances' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Employee balances retrieved successfully',
    type: [GetLeaveBalanceDto]
  })
  async getBalances(
    @Query('year') year: number,
    @Req() req: any
  ): Promise<GetLeaveBalanceDto[]> {
    this.logger.log(`Fetching balances for employee: ${req.user.employeeId}`);
    
    return this.employeeBalanceService.getEmployeeBalances(
      req.user.employeeId,
      req.user.companyId,
      year
    );
  }

  @Post('initialize')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Initialize employee balances' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        employeeId: { type: 'string' },
        year: { type: 'number', nullable: true }
      } 
    } 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Balances initialized successfully'
  })
  async initialize(
    @Body('employeeId', ParseUUIDPipe) employeeId: string,
    @Body('year') year: number,
    @Req() req: any
  ): Promise<EmployeeBalance[]> {
    this.logger.log(`Initializing balances for employee: ${employeeId}`);
    
    return this.employeeBalanceService.initializeEmployeeBalances(
      employeeId,
      req.user.companyId,
      year
    );
  }

  @Patch(':employeeId/:leaveTypeId/adjust')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Adjust employee leave balance' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiParam({ name: 'leaveTypeId', description: 'Leave Type ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        adjustment: { type: 'number' },
        reason: { type: 'string' }
      } 
    } 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Balance adjusted successfully'
  })
  async adjust(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('leaveTypeId', ParseUUIDPipe) leaveTypeId: string,
    @Body('adjustment') adjustment: number,
    @Body('reason') reason: string,
    @Req() req: any
  ): Promise<EmployeeBalance> {
    this.logger.log(`Adjusting balance for employee: ${employeeId}, leaveType: ${leaveTypeId}`);
    
    return this.employeeBalanceService.adjustBalance(
      employeeId,
      leaveTypeId,
      req.user.companyId,
      adjustment,
      reason
    );
  }

  @Get('team')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Get team members leave balances' })
  @ApiQuery({ name: 'employeeIds', type: [String] })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Team balances retrieved successfully'
  })
  async getTeamBalances(
    @Query('employeeIds') employeeIds: string[],
    @Query('year') year: number,
    @Req() req: any
  ): Promise<{ [employeeId: string]: GetLeaveBalanceDto[] }> {
    this.logger.log(`Fetching team balances for ${employeeIds.length} members`);
    
    return this.employeeBalanceService.getTeamBalances(
      employeeIds,
      req.user.companyId,
      year
    );
  }
}
'''

        # Leave Type Controller
        leave_type_controller = '''import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  HttpStatus,
  Req
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { LeaveTypeService } from '../services';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from '../dto';
import { LeaveType } from '../schemas';
import { JwtAuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/constants/user-roles.enum';

@ApiTags('Leave Types')
@ApiBearerAuth()
@Controller('leave-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveTypeController {
  private readonly logger = new Logger(LeaveTypeController.name);

  constructor(private readonly leaveTypeService: LeaveTypeService) {}

  @Post()
  @Roles(UserRole.HR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new leave type' })
  @ApiBody({ type: CreateLeaveTypeDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Leave type created successfully',
    type: LeaveType 
  })
  @ApiResponse({ status: 409, description: 'Leave type code already exists' })
  async create(
    @Body() createLeaveTypeDto: CreateLeaveTypeDto,
    @Req() req: any
  ): Promise<LeaveType> {
    this.logger.log(`Creating leave type: ${createLeaveTypeDto.name}`);
    
    return this.leaveTypeService.create({
      ...createLeaveTypeDto,
      companyId: req.user.companyId
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all leave types' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ 
    status: 200, 
    description: 'Leave types retrieved successfully',
    type: [LeaveType]
  })
  async findAll(
    @Query('includeInactive') includeInactive: boolean,
    @Req() req: any
  ): Promise<LeaveType[]> {
    this.logger.log(`Fetching leave types for company: ${req.user.companyId}`);
    
    return this.leaveTypeService.findAll(req.user.companyId, includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific leave type by ID' })
  @ApiParam({ name: 'id', description: 'Leave type ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Leave type retrieved successfully',
    type: LeaveType 
  })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ): Promise<LeaveType> {
    this.logger.log(`Fetching leave type: ${id}`);
    
    return this.leaveTypeService.findOne(id, req.user.companyId);
  }

  @Put(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Update a leave type' })
  @ApiParam({ name: 'id', description: 'Leave type ID' })
  @ApiBody({ type: UpdateLeaveTypeDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Leave type updated successfully',
    type: LeaveType 
  })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto,
    @Req() req: any
  ): Promise<LeaveType> {
    this.logger.log(`Updating leave type: ${id}`);
    
    return this.leaveTypeService.update(id, req.user.companyId, updateLeaveTypeDto);
  }

  @Delete(':id')
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Deactivate a leave type' })
  @ApiParam({ name: 'id', description: 'Leave type ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Leave type deactivated successfully',
    type: LeaveType 
  })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ): Promise<LeaveType> {
    this.logger.log(`Deactivating leave type: ${id}`);
    
    return this.leaveTypeService.deactivate(id, req.user.companyId);
  }
}
'''

        # Write controller files
        controllers = {
            'leave-request.controller.ts': leave_request_controller,
            'employee-balance.controller.ts': employee_balance_controller,
            'leave-type.controller.ts': leave_type_controller
        }

        for filename, content in controllers.items():
            self._write_file(self.output_dir / "controllers" / filename, content)

        # Controller index
        controller_index = '''export { LeaveRequestController } from './leave-request.controller';
export { EmployeeBalanceController } from './employee-balance.controller';
export { LeaveTypeController } from './leave-type.controller';
'''
        self._write_file(self.output_dir / "controllers" / "index.ts", controller_index)

        logger.info("Controller files generated successfully")

    def generate_module(self) -> None:
        """Generate the main module file"""
        logger.info("Generating module file...")

        module_content = '''import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { 
  LeaveRequestController, 
  EmployeeBalanceController, 
  LeaveTypeController 
} from './controllers';
import { 
  LeaveRequestService, 
  EmployeeBalanceService, 
  LeaveTypeService 
} from './services';
import { 
  LeaveType, 
  LeaveTypeSchema,
  EmployeeBalance, 
  EmployeeBalanceSchema,
  LeaveRequest, 
  LeaveRequestSchema,
  CompanySetting, 
  CompanySettingSchema 
} from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: EmployeeBalance.name, schema: EmployeeBalanceSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: CompanySetting.name, schema: CompanySettingSchema }
    ])
  ],
  controllers: [
    LeaveRequestController,
    EmployeeBalanceController,
    LeaveTypeController
  ],
  providers: [
    LeaveRequestService,
    EmployeeBalanceService,
    LeaveTypeService
  ],
  exports: [
    LeaveRequestService,
    EmployeeBalanceService,
    LeaveTypeService
  ]
})
export class LeaveModule {}
'''

        self._write_file(self.output_dir / "leave.module.ts", module_content)

        logger.info("Module file generated successfully")

    def generate_all(self) -> None:
        """Generate all necessary module components"""
        logger.info("Starting generation of all module components...")
        
        try:
            self.create_directory_structure()
            self.generate_schemas()
            self.generate_dtos()
            self.generate_services()
            self.generate_controllers()
            self.generate_module()
            
            logger.info("All module components generated successfully")
            
        except Exception as e:
            logger.error(f"Error generating module components: {str(e)}")
            raise

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='NestJS Leave Management Module Generator')
    parser.add_argument('--output-dir', default='./src/modules/leave', 
                       help='Output directory for generated module')
    
    args = parser.parse_args()
    
    try:
        generator = NestJSLeaveModuleGenerator(args.output_dir)
        generator.generate_all()
    except Exception as e:
        logger.error(f"Failed to generate module: {str(e)}")
        exit(1)
