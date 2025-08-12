import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateDocumentTypeDto {
  @IsString()
  title: string;

  @IsString()
  category: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}