import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { GetApiDto } from '../../shared/dto/get-api.dto';
import { PayrollStatus } from '../entities/payroll.entity';

export class GetPayrollDto extends GetApiDto {
  @Expose()
  @IsOptional()
  @IsString()
  payrollMonth?: string;

  @Expose()
  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;

  constructor() {
    super();
    this.sb = 'payrollMonth';
    this.sd = '1';
  }
}