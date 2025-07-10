import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SkillType } from '../entities/skill.entity';

export class CreateSkillDto {
  @ApiProperty({ example: 'JavaScript' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    enum: SkillType, 
    example: SkillType.ENGINEERING 
  })
  @IsEnum(SkillType)
  @IsNotEmpty()
  skillType: SkillType;
}