import { GetApiDto } from '@/modules/shared/dto';
import { ExperienceLevel, JobType } from '@/recruitment/shared/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsMongoId } from 'class-validator';

export class GetJobPositionDto extends GetApiDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsMongoId()
  department?: string;

  @ApiProperty({ enum: JobType, required: false })
  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;

  @ApiProperty({ enum: ExperienceLevel, required: false })
  @IsEnum(ExperienceLevel)
  @IsOptional()
  experienceLevel?: ExperienceLevel;

   constructor() {
    super();
    this.sb = 'title';
    this.sd = '1';  
   }
}
