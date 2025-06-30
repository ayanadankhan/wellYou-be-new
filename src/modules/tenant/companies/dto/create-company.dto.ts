import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsPhoneNumber, IsEnum } from 'class-validator';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class CreateCompanyDto {
  @ApiProperty({ description: 'Name of the company' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Industry of the company' })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiProperty({ description: 'Email of the company' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Phone Number of the company' })
  @IsPhoneNumber()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ description: 'Address of the company' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Founded Year of the company' })
  @IsString()
  @IsNotEmpty()
  foundedYear: string;

  @ApiProperty({ description: 'Number Of Employees of the company' })
  @IsNotEmpty()
  numberOfEmployees: string;

  @ApiProperty({ 
    description: 'Status of the company',
    enum: CompanyStatus,
    enumName: 'CompanyStatus',
    example: CompanyStatus.ACTIVE
  })
  @IsEnum(CompanyStatus)
  @IsNotEmpty()
  status: CompanyStatus;

  @ApiProperty({ description: 'Description of the company' })
  @IsString()
  @IsNotEmpty()
  description: string;
}