import { IsNotEmpty, IsString, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class IncrementSalaryProfileDto {
  @IsNumber() base: number;
  @IsNumber() hourlyRate: number;
  @IsString() reason: string;
  @IsString() approvedBy: string;
  @IsDate() @Type(() => Date) effectiveDate: Date;
}
