import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength, IsIn } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maximumDays?: number = 0;

  @IsOptional()
  @IsString()
  @IsIn(['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'teal', 'gray'])
  color?: string = 'blue';

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowPartialDays?: boolean = false;

  @IsOptional()
  @IsBoolean()
  carryOverAllowed?: boolean = false;
}