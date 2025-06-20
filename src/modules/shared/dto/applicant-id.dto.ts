import { IsOptional, IsNotEmpty, IsMongoId } from "class-validator";

export class ApplicantIdRequiredDto {
  @IsNotEmpty()
  @IsMongoId()
  ApplicantId: string;
}