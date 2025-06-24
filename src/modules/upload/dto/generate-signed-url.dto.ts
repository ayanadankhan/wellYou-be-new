import { IsEnum, IsNotEmpty, Matches, MaxLength, IsString } from "class-validator";

export class GenerateSignedUrlDto {
  @IsNotEmpty()
  @MaxLength(500)
  @Matches(/\.(jpe?g|png|webp|mp4|jfif|3gp|pdf|srt)$/i, {
    message: "Only jpg, jpeg, png, webp, mp4, 3gp, pdf, jfif and srt files are allowed."
  })
  name: string;

  @IsNotEmpty()
  @IsEnum(["private", "public-read", "public-read-write", "authenticated-read"])
  access: string;
  
  // @IsNotEmpty()
  // @IsString()
  // brandId: string;
}
