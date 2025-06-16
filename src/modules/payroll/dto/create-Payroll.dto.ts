import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { PayrollStatus } from '../entities/payroll.entity';

export class CreatePayrollDto {
  @IsNotEmpty()
  @IsString()
  payrollMonth: string;

  @IsNotEmpty()
  @IsNumber()
  totalGross: number;

  @IsNotEmpty()
  @IsNumber()
  totalDeduction: number;

  @IsNotEmpty()
  @IsNumber()
  totalAddition: number;

  @IsNotEmpty()
  @IsNumber()
  netPay: number;

  @IsNotEmpty()
  @IsEnum(PayrollStatus)
  status: PayrollStatus;

  @IsArray()
  @IsNotEmpty()
  selectedEmployees: Record<string, any>[];
}