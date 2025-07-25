import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';
import { GetApiDto } from '../../shared/dto/get-api.dto';
import { RequestStatus, RequestType } from './create-request-mangment.dto';

export class GetRequestDto extends GetApiDto {
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @Expose()
  @IsOptional()
  @IsEnum(RequestType)
  type?: RequestType;

  @Expose()
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  constructor() {
    super();
    this.sb = 'appliedDate';
    this.sd = '-1';
  }
}