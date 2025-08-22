import { IsString, IsEmail, IsDateString, IsNumber, IsArray, IsBoolean, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { GetApiDto } from '../../shared/dto/get-api.dto';
import { Types } from 'mongoose';

export enum DocumentStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  COMPLETED = 'COMPLETED'
}
export class GetEmployeeDto extends GetApiDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsOptional()
  instruction: string;

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

  @IsOptional()
  @IsEnum(DocumentStatus)
  documentStatus?: DocumentStatus;
  
  constructor() {
    super();
    this.sb = 'createdAt';
    this.sd = '1';
  }
}