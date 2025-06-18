import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetSkillCategoryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === 'false' ? value === 'true' : undefined)
  isActive?: boolean;
}
