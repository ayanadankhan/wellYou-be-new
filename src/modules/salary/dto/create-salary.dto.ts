import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested, IsDate, IsEnum, Min, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class SalaryComponentDto {
  @IsNotEmpty()
  @IsMongoId()
  titleId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PaymentMethodDto {
  @IsNotEmpty()
  @IsEnum(['bank_transfer', 'check', 'cash', 'direct_deposit'])
  type: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  routingNumber?: string;

  @IsOptional()
  @IsString()
  swiftCode?: string;
}

export class CreateSalaryDto {
  @IsNotEmpty()
  @IsMongoId()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  employeeName: string;

  @IsNotEmpty()
  @IsString()
  employeeCode: string;

  @IsNotEmpty()
  @IsString()
  department: string;

  @IsNotEmpty()
  @IsString()
  position: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNotEmpty()
  @IsEnum(['monthly', 'bi-weekly', 'weekly', 'daily', 'hourly'])
  payFrequency: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryComponentDto)
  additions?: SalaryComponentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryComponentDto)
  deductions?: SalaryComponentDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod?: PaymentMethodDto;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  effectiveDate: Date;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}

export class SalaryIncrementDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(['monthly', 'bi-weekly', 'weekly', 'daily', 'hourly'])
  payFrequency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryComponentDto)
  additions?: SalaryComponentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryComponentDto)
  deductions?: SalaryComponentDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod?: PaymentMethodDto;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  effectiveDate: Date;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsString()
  approvedBy: string;

  @IsNotEmpty()
  @IsString()
  createdBy: string;
}