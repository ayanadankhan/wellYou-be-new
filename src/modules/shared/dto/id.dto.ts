import { IsOptional, IsNotEmpty, IsMongoId } from "class-validator";

export class IdOptionalDto {
  @IsOptional()
  @IsMongoId()
  id: string;
}

export class IdRequiredDto {
  @IsNotEmpty()
  @IsMongoId()
  id: string;
}