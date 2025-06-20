import { IsOptional, MaxLength } from "class-validator";

export class GetApiDto {
  @IsOptional()
  @MaxLength(100)
  s: string;

  @IsOptional()
  sb: any;

  @IsOptional()
  sd: string;

  @IsOptional()
  l: number = 10;

  @IsOptional()
  o: number = 0;
}
