import { IsOptional, IsString, IsNumber, Min, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { GetApiDto } from '../../shared/dto/get-api.dto';

export class GetEmployeeDocumentsDto extends GetApiDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsOptional()
  instruction: string;
  
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
  documentStatus?: string;

  @IsOptional()
  @IsString()
  status?: string;

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