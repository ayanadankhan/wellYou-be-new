import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsDateString,
    IsMongoId,
    ValidateNested,
    IsArray,
    ArrayMinSize,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
    @IsEnum(['Onsite', 'Online'])
    mode: 'Onsite' | 'Online';

    @IsString()
    @IsNotEmpty()
    details: string;
}

export class OrganizerDto {
    @IsMongoId()
    @IsNotEmpty()
    department: string; // Department ID

    @IsArray()
    @ArrayMinSize(1)
    @IsMongoId({ each: true })
    selectedEmployees: string[]; // Employee IDs
}

export class TargetAudienceDto {
    @IsEnum(['All Employees', 'Individuals', 'Departments'])
    type: 'All Employees' | 'Individuals' | 'Departments';

    @IsEnum(['Public', 'Private'])
    visibility: 'Public' | 'Private';

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    audience?: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    individualIds?: string[];

     @IsArray()
    @IsOptional()
    @IsString({ each: true })
    departmentIds?: string[];
}

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsEnum(['Training', 'Celebration', 'Meeting', 'Awards', 'Other'])
    category: string;

    @IsDateString()
    startDate: Date;

    @IsDateString()
    endDate: Date;

    @ValidateNested()
    @Type(() => LocationDto)
    location: LocationDto;

    @ValidateNested({ each: true })
    @Type(() => OrganizerDto)
    organizers: OrganizerDto[];

    @ValidateNested()
    @Type(() => TargetAudienceDto)
    targetAudience: TargetAudienceDto;

    @IsEnum(['Scheduled', 'Completed', 'Cancelled', 'Postponed'])
    status: string;

    @IsNumber()
    budget: number;

    @IsEnum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'])
    currency: string;

    @IsOptional()
    @IsString()
    createdBy?: string;
}

export class UpdateEventDto extends CreateEventDto { }
