import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SalaryPayResponseDto {
  @ApiProperty()
  basePay: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  payFrequency: string;

  @ApiProperty({ required: false })
  hourlyRate?: string;
}

export class DeductionsResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ required: false })
  description?: string;
}

export class AdditionsResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ required: false })
  description?: string;
}

export class PaymentDetailsResponseDto {
  @ApiProperty()
  method: string;

  @ApiProperty({ required: false })
  bankName?: string;

  @ApiProperty({ required: false })
  routingName?: string;

  @ApiProperty({ required: false })
  accountNumber?: string;
}

export class GetSalaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeesId: string;

  @ApiProperty()
  salaryPay: SalaryPayResponseDto;

  @ApiProperty({ type: [DeductionsResponseDto], required: false })
  deductions?: DeductionsResponseDto[];

  @ApiProperty({ type: [AdditionsResponseDto], required: false })
  additions?: AdditionsResponseDto[];

  @ApiProperty()
  paymentDetails: PaymentDetailsResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
