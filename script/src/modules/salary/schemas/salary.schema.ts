import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Salary extends Document {
  @Prop({ required: true, type: Types.ObjectId })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  employeeName: string;

  @Prop([{
    title: { type: Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' }
  }])
  additions: Record<string, any>[];

  @Prop([{
    title: { type: Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' }
  }])
  deductions: Record<string, any>[];

  @Prop()
  salary: {
    base: number;
    hourlyRate: number;
    currency: string;
    payFrequency: string;
  };

  @Prop()
  payrollPeriod: {
    startDate: Date;
    endDate: Date;
  };

  @Prop()
  paymentMethod: {
    type: string;
    bankName: string;
    routingNumber: string;
    accountNumber: string;
  };

  @Prop()
  netPay: number;

  @Prop({ default: 'pending' })
  status: string;
}

export const SalarySchema = SchemaFactory.createForClass(Salary);
