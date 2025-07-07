import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAdditionDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  o?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  l?: number;
}
