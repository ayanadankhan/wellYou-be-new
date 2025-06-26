import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { required } from 'joi';
import { Schema as MongooseSchema, Document, Types, SchemaTypes } from "mongoose";

@Schema({ timestamps: true })
export class Salary extends Document {

@Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: 'Employee' })
employeesId: Types.ObjectId;

  @Prop({
    type: {
      basePay: { type: Number, required: true },
      currency: { type: String, required: true },
      payFrequency: { type: String, required: true },
      hourlyRate: { type: String, required: false }
    },
    required: true
  })
  salaryPay: {
    basePay: number;
    currency: string;
    payFrequency: string;
    hourlyRate?: string;
  };

  @Prop({
    type: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true },
      description: { type: String }
    }],
    default: []
  })
  deductions: {
    name: string;
    amount: number;
    description?: string;
  }[];

  @Prop({
    type: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true },
      description: { type: String }
    }],
    default: []
  })
  additions: {
    name: string;
    amount: number;
    description?: string;
  }[];

  @Prop({
    type: {
      method: { type: String, required: true },
      bankName: { type: String },
      routingName: { type: String },
      accountNumber: { type: String }
    },
    required: true
  })
  paymentDetails: {
    method: string;
    bankName?: string;
    routingName?: string;
    accountNumber?: string;
  };
}

export const SalarySchema = SchemaFactory.createForClass(Salary);
