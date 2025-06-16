import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum PayrollStatus {
  PENDING = 'PROCESSING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

@Schema()
export class Payroll extends Document {
  @Prop({ required: true })
  payrollMonth: string;

  @Prop({ required: true, default: 0 })
  totalGross: number;

  @Prop({ required: true, default: 0 })
  totalDeduction: number;

  @Prop({ required: true, default: 0 })
  totalAddition: number;

  @Prop({ required: true, default: 0 })
  netPay: number;

  @Prop({ enum: PayrollStatus, default: PayrollStatus.PENDING })
  status: PayrollStatus;

  @Prop({ type: Array, default: [] })
  selectedEmployees: Record<string, any>[];
}

export const PayrollSchema = SchemaFactory.createForClass(Payroll);