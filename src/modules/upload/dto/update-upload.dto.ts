import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUploadDto } from './create-upload.dto';

export class UpdateUploadDto extends PartialType(CreateUploadDto) {
  @IsOptional()
  @IsBoolean()
  inUse: boolean;
}
