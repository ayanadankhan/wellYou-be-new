import { GetApiDto } from '@/modules/shared/dto';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class GetExpenseDto extends GetApiDto {
  @IsOptional()
  @IsString()
  general?: string;

  @IsOptional()
  @IsString()
  subType?: string;

  @IsOptional()
  @IsString()
  isActive?: boolean;

  constructor() {
    super();
    this.sb = 'title';
    this.sd = '1';  
   }
}
