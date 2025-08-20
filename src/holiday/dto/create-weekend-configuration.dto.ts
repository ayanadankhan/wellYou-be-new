// src/modules/holiday/dto/create-weekend-configuration.dto.ts

import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

// Re-using EmployeeType for consistency
type EmployeeType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'consultant';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export class CreateWeekendConfigurationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsArray()
  @IsNotEmpty({ each: true })
  @IsEnum(
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    { each: true },
  )
  weekendDays: DayOfWeek[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDepartments?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(
    ['full_time', 'part_time', 'contract', 'intern', 'consultant'],
    { each: true },
  )
  applicableEmployeeTypes?: EmployeeType[];
}