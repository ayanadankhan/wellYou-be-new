
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Name of the company' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Address of the company', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Phone number of the company', required: false })
  @IsOptional()
 
  phone?: string;

  @ApiProperty({ example: 'info@example.com', description: 'Email of the company', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}
