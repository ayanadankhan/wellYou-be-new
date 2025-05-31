
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class BaseDto {
  @ApiPropertyOptional({ description: 'Is the entity active?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
