import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';
import { GetApiDto } from '../../../shared/dto/get-api.dto';
import { UserRole } from '../schemas/user.schema';

export class GetUserDto extends GetApiDto {
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @Expose()
  @IsOptional()
  @IsString()
  email?: string;

  @Expose()
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @Expose()
  @IsOptional()
  @IsString()
  tenantId?: string;

  constructor() {
    super();
    this.sb = 'createdAt';
    this.sd = '1';
  }
}