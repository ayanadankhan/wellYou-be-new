import { IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateDegreeDto {
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
