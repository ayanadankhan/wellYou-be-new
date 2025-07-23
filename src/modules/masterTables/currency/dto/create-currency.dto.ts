import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCurrencyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  symbol: string;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsBoolean()
  isActive: boolean;
}