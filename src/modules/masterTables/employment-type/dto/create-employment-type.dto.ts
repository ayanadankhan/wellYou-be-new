import { IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateEmploymentTypeDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
