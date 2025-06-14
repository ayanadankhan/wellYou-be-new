import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';

class SalaryPayDto {
  @ApiProperty()
  @IsNumber()
  basePay: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsString()
  payFrequency: string;

  @ApiProperty({ required: false })
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
  @IsDate()
  @Type(() => Date)
  payPeriodStart: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  payPeriodEnd: Date;

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