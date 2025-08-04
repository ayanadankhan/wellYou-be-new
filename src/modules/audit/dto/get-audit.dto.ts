import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';
import { GetApiDto } from '../../shared/dto/get-api.dto';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export enum AuditFlag {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red'
}

export class GetAuditDto extends GetApiDto {
  @Expose()
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  module?: string;

  @Expose()
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @Expose()
  @IsOptional()
  @IsEnum(AuditFlag)
  flag?: AuditFlag;

  @Expose()
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  performedBy?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  startDate?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  endDate?: string;

  constructor() {
    super();
    this.sb = 'createdAt';
    this.sd = '-1';
  }
}