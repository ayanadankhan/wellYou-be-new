import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

// Step 1: Define Enum
export enum PayFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  HOURLY = 'HOURLY'
}

// Step 2: SalaryPayDto with conditional hourlyRate
class SalaryPayDto {
  @ApiProperty()
  @IsNumber()
  basePay: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty({ enum: PayFrequency })
  @IsEnum(PayFrequency)
  payFrequency: PayFrequency;

  @ApiProperty({ required: false })
  @ValidateIf(o => o.payFrequency === PayFrequency.HOURLY)
  @IsNotEmpty()
  @IsString()
  hourlyRate?: string;
}

class DeductionsDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false })
  @IsString()
  description?: string;
}

class AdditionsDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false })
  @IsString()
  description?: string;
}

class PaymentDetailsDto {
  @ApiProperty()
  @IsString()
  method: string;

  @ApiProperty({ required: false })
  @IsString()
  bankName?: string;

  @ApiProperty({ required: false })
  @IsString()
  routingName?: string;

  @ApiProperty({ required: false })
  @IsString()
  accountNumber?: string;
}

export class CreateSalaryDto {
  @ApiProperty()
 
  @IsNotEmpty()
  employeesId: Types.ObjectId;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => SalaryPayDto)
  salaryPay: SalaryPayDto;

  @ApiProperty({ type: [DeductionsDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeductionsDto)
  deductions?: DeductionsDto[];

  @ApiProperty({ type: [AdditionsDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionsDto)
  additions?: AdditionsDto[];

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails: PaymentDetailsDto;
}