// src/modules/holiday/dto/create-holiday.dto.ts
// This DTO defines the data structure for creating a new holiday.

import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  ArrayNotEmpty,
  ArrayUnique,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Define the enum-like types for validation
export enum HolidayType {
  NATIONAL = 'national',
  RELIGIOUS = 'religious',
  CULTURAL = 'cultural',
  REGIONAL = 'regional',
  COMPANY = 'company',
  FESTIVAL = 'festival',
  MEMORIAL = 'memorial',
  BANK = 'bank',
}

export enum RecurringPattern {
  YEARLY = 'yearly',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  CUSTOM = 'custom',
}

export enum EmployeeType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
  CONSULTANT = 'consultant',
}

export enum CompensationPolicy {
  PAID = 'paid',
  UNPAID = 'unpaid',
  OPTIONAL_WORK = 'optional_work',
  PREMIUM_PAY = 'premium_pay',
  COMP_OFF = 'comp_off',
}

export class CreateHolidayDto {
  @ApiProperty({ description: 'The name of the holiday.' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    enum: HolidayType,
    description: 'The type of holiday.',
  })
  @IsEnum(HolidayType)
  type: HolidayType;

  @ApiProperty({
    required: false,
    description: 'An optional description of the holiday.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The date of the holiday in YYYY-MM-DD format.',
  })
  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @ApiProperty({
    default: false,
    description: 'Indicates if this is a recurring holiday.',
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({
    enum: RecurringPattern,
    required: false,
    description: 'The pattern for a recurring holiday.',
  })
  @IsOptional()
  @IsEnum(RecurringPattern)
  recurringPattern?: RecurringPattern;

  @ApiProperty({
    default: false,
    description: 'Indicates if this is an optional holiday.',
  })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @ApiProperty({
    enum: CompensationPolicy,
    description: 'The compensation policy for the holiday.',
  })
  @IsEnum(CompensationPolicy)
  compensationPolicy: CompensationPolicy;

  @ApiProperty({
    isArray: true,
    description: 'An array of locations where the holiday is observed.',
    example: ['New York', 'London'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()

  applicableLocations: string[];

  @ApiProperty({
    isArray: true,
    description: 'An array of departments to which the holiday applies.',
    example: ['Engineering', 'Marketing'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()

  applicableDepartments: string[];

  @ApiProperty({
    enum: EmployeeType,
    isArray: true,
    description: 'An array of employee types to which the holiday applies.',
    example: ['full_time'],
  })
  @IsArray()
  @IsEnum(EmployeeType, { each: true })
  @ArrayNotEmpty()
 
  applicableEmployeeTypes: EmployeeType[];
}
