import { GetApiDto } from '@/modules/shared/dto';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class GetDocumentTypeDto extends GetApiDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  isDefault?: boolean;

  constructor() {
    super();
    this.sb = 'title';
    this.sd = '1';  
   }

}
