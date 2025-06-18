
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Name of the company' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
