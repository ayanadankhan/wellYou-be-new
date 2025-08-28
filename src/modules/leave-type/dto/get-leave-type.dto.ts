import { GetApiDto } from '@/modules/shared/dto';
import { IsString, IsOptional, IsBoolean, IsInt, IsIn } from 'class-validator';

export class GetLeaveTypeDto extends GetApiDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  maximumDays?: number;

  @IsOptional()
  @IsString()
  @IsIn(['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'teal', 'gray'])
  color?: string;

  @IsOptional()
  @IsString()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  allowPartialDays?: boolean;

  @IsOptional()
  @IsBoolean()
  carryOverAllowed?: boolean;

  constructor() {
    super();
    this.sb = 'title';
    this.sd = '1';  
   }
}
