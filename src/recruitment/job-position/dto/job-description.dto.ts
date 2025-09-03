import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExperienceLevel, JobType, WorkplaceType } from '../../shared/enums';

export class GenerateJobDescriptionDto {
  @ApiProperty({ example: 'Senior Backend Developer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'TechInnovators Inc.' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: ['Node.js', 'NestJS', 'MongoDB'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keySkills?: string[];

  @ApiProperty({ example: ['Design and develop backend systems', 'Collaborate with frontend team'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibilities?: string[];

  @ApiProperty({ example: ['Competitive salary', 'Health insurance'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @ApiProperty({ enum: ExperienceLevel, example: ExperienceLevel.SENIOR })
  @IsEnum(ExperienceLevel)
  experienceLevel: ExperienceLevel;

  @ApiProperty({ enum: JobType, example: JobType.FULL_TIME })
  @IsEnum(JobType)
  jobType: JobType;

  @ApiProperty({ enum: WorkplaceType, example: WorkplaceType.HYBRID })
  @IsEnum(WorkplaceType)
  workplaceType: WorkplaceType;

  @ApiProperty({ example: 'We are seeking a highly skilled and motivated developer to join our growing team.' })
  @IsString()
  @IsOptional()
  baseDescription?: string;
}
