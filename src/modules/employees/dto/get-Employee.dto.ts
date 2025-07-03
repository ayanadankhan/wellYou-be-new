import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsDateString, IsNumber, IsArray, IsBoolean, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class GetEmployeeDto {
 
  @IsOptional()
  tenantId: Types.ObjectId;

  @IsOptional()
  userId: Types.ObjectId;

  @IsOptional()
  departmentId: Types.ObjectId;

  @IsOptional()
  positionId: Types.ObjectId;

  @IsOptional()
  reportingTo: Types.ObjectId;

  @IsOptional()
  employmentStatus: string;
}