import { IsNotEmpty, IsOptional, IsString, IsNumber, ValidateNested, IsArray, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

class PayItemDto {
  @IsNotEmpty() @IsString() title: string;
  @IsNotEmpty() @IsNumber() amount: number;
  @IsOptional() @IsString() description?: string;
}

class SalaryDetailsDto {
  @IsNumber() base: number;
  @IsNumber() hourlyRate: number;
  @IsString() currency: string;
  @IsString() payFrequency: string;
}

class PeriodDto {
  @IsDate() startDate: Date;
  @IsDate() endDate: Date;
}

class PaymentDto {
  @IsString() type: string;
  @IsString() bankName: string;
  @IsString() routingNumber: string;
  @IsString() accountNumber: string;
}

export class CreateSalaryDto {
  @IsNotEmpty() @IsString() employeeId: string;
  @IsNotEmpty() @IsString() employeeName: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PayItemDto) additions: PayItemDto[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => PayItemDto) deductions: PayItemDto[];
  @ValidateNested() @Type(() => SalaryDetailsDto) salary: SalaryDetailsDto;
  @ValidateNested() @Type(() => PeriodDto) payrollPeriod: PeriodDto;
  @ValidateNested() @Type(() => PaymentDto) paymentMethod: PaymentDto;
  @IsNumber() netPay: number;
  @IsOptional() @IsString() status?: string;
}
