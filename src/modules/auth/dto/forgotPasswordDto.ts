// src/modules/auth/dto/change-password.dto.ts
import {  IsNotEmpty, IsEmail } from 'class-validator';

export class ForgotPasswordDto {
 @IsEmail({}, { message: 'email must be a valid email' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  
}