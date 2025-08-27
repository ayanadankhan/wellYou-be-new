// src/company/dto/get-company.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';
import { GetApiDto } from '../../../shared/dto/get-api.dto';
import { CompanyStatus } from './create-company.dto';

export class GetCompanyDto extends GetApiDto {
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @Expose()
  @IsOptional()
  @IsString()
  industry?: string;

  @Expose()
  @IsOptional()
  @IsString()
  email?: string;

  @Expose()
  @IsOptional()
  @IsString()
  number?: string;

  @Expose()
  @IsOptional()
  @IsString()
  address?: string;
  
  @Expose()
  @IsOptional()
  @IsString()
  shortCode?: string;

  @Expose()
  @IsOptional()
  @IsString()
  foundedYear?: number;

  @Expose()
  @IsOptional()
  @IsString()
  numberOfEmployees?: string;

  @ApiProperty({ required: false, enum: CompanyStatus })
  @Expose()
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  constructor() {
    super();
    this.sb = 'name';
    this.sd = '1';
  }
}