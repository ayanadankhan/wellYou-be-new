import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateDocumentTypeDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}