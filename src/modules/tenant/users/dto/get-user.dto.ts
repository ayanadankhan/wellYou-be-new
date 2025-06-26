import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNumber, Min, IsIn } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class GetUserDto {
  @ApiPropertyOptional({ 
    example: 'john.doe@example.com', 
    description: 'Filter by email address (partial match)' 
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Filter by first name (partial match)',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Filter by last name (partial match)',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: UserRole.EMPLOYEE,
    enum: UserRole,
    description: 'Filter by user role',
  })
  @IsOptional()
  @IsIn(Object.values(UserRole))
  role?: UserRole;

  @ApiPropertyOptional({
    example: '654321098765432109876543',
    description: 'Filter by tenant ID',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Pagination offset (number of records to skip)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  o?: number = 0;

  @ApiPropertyOptional({
    example: 10,
    description: 'Pagination limit (max number of records to return)',
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  l?: number = 10;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
    enum: ['email', 'firstName', 'lastName', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['email', 'firstName', 'lastName', 'createdAt', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Sort direction',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'desc';
}