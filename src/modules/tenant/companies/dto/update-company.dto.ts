
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail, IsPhoneNumber } from 'class-validator';
import { CreateCompanyDto } from './create-company.dto';
import { BaseDto } from '@/shared/dto/base.dto'; // Assuming BaseDto exists

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @ApiPropertyOptional({ description: 'Is the company active?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
