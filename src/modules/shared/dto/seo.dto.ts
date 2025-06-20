import { IsString, IsOptional, IsNotEmpty } from "class-validator";

export class SeoDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  keywords: string;
}