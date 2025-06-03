
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateDeductionDto {
  @IsString()
  title: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}