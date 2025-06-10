import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateSalaryProfileDto {
  @IsNotEmpty() @IsString() employeeId: string;
  @IsNotEmpty() @IsString() employeeName: string;
  @IsNumber() base: number;
  @IsNumber() hourlyRate: number;
  @IsString() currency: string;
  @IsString() payFrequency: string;
}
