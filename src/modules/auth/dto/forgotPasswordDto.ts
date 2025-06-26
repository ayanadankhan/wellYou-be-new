// src/modules/auth/dto/change-password.dto.ts
import { IsString, MinLength, IsNotEmpty, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsString({ message: 'email must be a email' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;
}