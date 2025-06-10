import { IsNotEmpty, IsNumber, IsString, IsArray, ValidateNested, IsDate, IsOptional, Min, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer'; // For payload transformation

// DTO for individual additions or deductions to salary.
export class AddOrDeductDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0) // Amount should not be negative.
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

// DTO for payment method details.
export class PaymentMethodDto {
  @IsNotEmpty()
  @IsString()
  type: string; // e.g., "Bank Transfer", "Check"

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  routingNumber?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;
}

// Main DTO for salary details. This is used when providing new salary information,
// such as during an initial salary setup or a salary increment.
export class SalaryDetailDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  base: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsString()
  payFrequency: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) // Validates each item in the array.
  @Type(() => AddOrDeductDto) // Specifies the type for array items for validation and transformation.
  additions?: AddOrDeductDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddOrDeductDto)
  deductions?: AddOrDeductDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod?: PaymentMethodDto;

  @IsNotEmpty()
  @IsDate() // Validates if the value is a date.
  @Type(() => Date) // Ensures transformation from string to Date object during payload processing.
  effectiveDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date; // Typically not set for 'current' salary, but can be for historical or future-dated entries.

  @IsOptional()
  @IsString()
  reason?: string; // Reason for this salary (e.g., "Annual Increment", "Promotion")

  @IsOptional()
  @IsString()
  approvedBy?: string; // Identifier of who approved this salary.
}