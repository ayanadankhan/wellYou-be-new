import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsBoolean,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateDocumentDto {
  @IsMongoId()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  documentType: string; // Form, Agreement, ID Proof

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  templateUrl: string;

  @IsBoolean()
  isDefault: boolean;

  @IsBoolean()
  isExpiry: boolean;

  @IsBoolean()
  requireApproval: boolean;

  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  @IsOptional()
  allowedTypes: string[]; // Array of allowed file types like ["pdf", "doc", "docx"]
}