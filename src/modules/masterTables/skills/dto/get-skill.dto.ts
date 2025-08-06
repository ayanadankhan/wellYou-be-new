import { IsOptional, IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';
import { GetApiDto } from '../../../shared/dto/get-api.dto';
import { SkillType } from '../entities/skill.entity';

export class GetSkillDto extends GetApiDto {
  @Expose()
  @IsOptional()
  @IsEnum(SkillType)
  skillType?: SkillType;

  constructor() {
    super();
    this.sb = 'createdAt';
    this.sd = '-1';
  }
}