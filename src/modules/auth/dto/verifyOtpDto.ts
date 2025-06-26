// src/modules/auth/dto/verifyOtpDto.ts
import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  otp: number;
}