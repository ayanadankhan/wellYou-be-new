import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum HolidayType {
  NATIONAL = 'national',
  RELIGIOUS = 'religious',
  CULTURAL = 'cultural',
  REGIONAL = 'regional',
  COMPANY = 'company',
  FESTIVAL = 'festival',
  MEMORIAL = 'memorial',
  BANK = 'bank',
  WEEKEND = 'weekend',
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

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export class CreateHolidayDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEnum(HolidayType)
  type: HolidayType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: Date;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurringPattern)
  recurringPattern?: RecurringPattern;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  location?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDepartments?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(EmployeeType, { each: true })
  applicableEmployeeTypes?: EmployeeType[];

  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  days?: DayOfWeek[];
}
