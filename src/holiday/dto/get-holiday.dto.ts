// src/holiday/dto/get-holiday.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';
import { GetApiDto } from '../../modules/shared/dto/get-api.dto';

export enum HolidayType {
  National = 'national',
  Religious = 'religious',
  Cultural = 'cultural',
  Regional = 'regional',
  Company = 'company',
  Festival = 'festival',
  Memorial = 'memorial',
  Bank = 'bank',
  Weekend = 'weekend',
}

export class GetHolidayDto extends GetApiDto {
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, enum: HolidayType })
  @Expose()
  @IsOptional()
  @IsEnum(HolidayType)
  type?: HolidayType;

  @Expose()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @Expose()
  @IsOptional()
  @IsString()
  updatedBy?: string;

  constructor() {
    super();
    this.sb = 'createdAt';
    this.sd = '-1';
  }
}
