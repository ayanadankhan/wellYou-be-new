import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';
import { GetApiDto } from './../../shared/dto/get-api.dto';
import { EventCategory, EventStatus } from '../entities/event.entity';

export class GetEventDto extends GetApiDto {
  @Expose()
  @IsOptional()
  @IsString()
  title?: string;

  @Expose()
  @IsOptional()
  @IsEnum(['Training', 'Celebration', 'Meeting', 'Awards', 'Other'])
  category?: EventCategory;

  @Expose()
  @IsOptional()
  @IsEnum(['Scheduled', 'Completed', 'Cancelled', 'Postponed'])
  status?: EventStatus;

  @Expose()
  @IsOptional()
  @IsString()
  month: string;

  constructor() {
    super();
    this.sb = 'createdAt';
    this.sd = '-1';
  }
}
