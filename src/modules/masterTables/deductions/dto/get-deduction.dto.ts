import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { GetApiDto } from '@/modules/shared/dto';

export class GetDeductionDto extends GetApiDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  isDefault?: boolean;

  constructor() {
  super();
  this.sb = 'title';
  this.sd = '1';  
  }
}
