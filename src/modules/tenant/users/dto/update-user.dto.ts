
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '../schemas/user.schema';
import { BaseDto } from '@/shared/dto/base.dto';
import { CreateUserDto } from './create-user.dto'; // Import for PartialType

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Is the user active?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
