import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsBoolean,
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
  @IsNotEmpty()
  templateUrl: string;

  @IsBoolean()
  isDefault: boolean;

  @IsBoolean()
  isExpiry: boolean;
}
