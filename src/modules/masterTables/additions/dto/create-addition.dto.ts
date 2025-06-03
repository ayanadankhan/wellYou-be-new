import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAdditionDto {
  @IsString()
  title: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}