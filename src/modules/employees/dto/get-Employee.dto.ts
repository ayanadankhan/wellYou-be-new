import { IsString, IsEmail, IsDateString, IsNumber, IsArray, IsBoolean, ValidateNested, IsOptional } from 'class-validator';
import { GetApiDto } from '../../shared/dto/get-api.dto';
import { Types } from 'mongoose';

export class GetEmployeeDto extends GetApiDto {
  @IsOptional()
  @IsString()
  name?: string;

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

  constructor() {
    super();
    this.sb = 'createdAt';
    this.sd = '1';
  }
}