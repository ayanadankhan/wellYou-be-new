import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { GetApiDto } from '../../shared/dto/get-api.dto';

export class GetEmployeeDocumentsDto extends GetApiDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  documentStatus?: string; // 'pending', 'uploaded', 'completed'

  @IsOptional()
  @IsString()
  status?: string; // employment status

  @IsOptional()
  @Transform(({ value }) => value ? new Types.ObjectId(value) : undefined)
  tenantId?: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => value ? new Types.ObjectId(value) : undefined)
  userId?: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => value ? new Types.ObjectId(value) : undefined)
  departmentId?: Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => value ? new Types.ObjectId(value) : undefined)
  positionId?: Types.ObjectId;

  constructor() {
    super();
    this.sb = 'createdAt';
    this.sd = '1';
  }
}