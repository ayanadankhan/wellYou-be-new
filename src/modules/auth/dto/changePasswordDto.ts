// src/modules/auth/dto/change-password.dto.ts
import { IsString, MinLength, IsNotEmpty, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  oldPassword: string;

  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}