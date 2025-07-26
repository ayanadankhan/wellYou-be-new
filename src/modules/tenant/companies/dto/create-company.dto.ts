import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsPhoneNumber, IsEnum } from 'class-validator';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DRAFT = 'DRAFT',
}

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  industry: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  foundedYear: number;

  @IsNotEmpty()
  numberOfEmployees: string;

  @IsEnum(CompanyStatus)
  @IsNotEmpty()
  status: CompanyStatus;

  @IsString()
  description: string;
}