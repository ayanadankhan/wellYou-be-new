// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsNotEmpty, IsEnum, IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  MANAGER = 'manager'
}

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
  })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

 @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;


}