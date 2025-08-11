import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  general: string;

  @IsString()
  subType: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}