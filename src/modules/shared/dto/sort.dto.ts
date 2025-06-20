import { IsOptional } from "class-validator";

export class SortDto {
  @IsOptional()
  sortBy: string;

  @IsOptional()
  sortDirection: string;
}
