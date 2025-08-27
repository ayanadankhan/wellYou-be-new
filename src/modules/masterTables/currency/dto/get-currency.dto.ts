import { GetApiDto } from '@/modules/shared/dto';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetCurrencyDto extends GetApiDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  isActive?: boolean;

  constructor() {
    super();
    this.sb = 'title';
    this.sd = '1';  
   }
}
