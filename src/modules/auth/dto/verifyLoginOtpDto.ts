import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class VerifyLoginOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumberString()
  @Length(6, 6)
  otp: string;
}