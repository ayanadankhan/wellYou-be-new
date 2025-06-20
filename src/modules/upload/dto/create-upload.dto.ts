import { IsString, IsNotEmpty, IsEnum, MaxLength, IsUrl, IsMongoId, MinLength } from "class-validator";
import { Schema as MongooseSchema } from "mongoose";

export class CreateUploadDto {
  @IsNotEmpty()
  @MaxLength(500)
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsUrl()
  location: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsEnum(["private", "public-read", "public-read-write", "authenticated-read"])
  access: string;

  @IsNotEmpty()
  @IsMongoId()
  createdBy: MongooseSchema.Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  companyId: MongooseSchema.Types.ObjectId;;
}
