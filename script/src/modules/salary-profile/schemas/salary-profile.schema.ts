import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SalaryProfile extends Document {
  @Prop({ required: true, type: Types.ObjectId, unique: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  employeeName: string;

  @Prop({
    type: {
      base: Number,
      hourlyRate: Number,
      currency: String,
      payFrequency: String
    }
  })
  current: {
    base: number;
    hourlyRate: number;
    currency: string;
    payFrequency: string;
  };

  @Prop({
    type: [{
      base: Number,
      hourlyRate: Number,
      effectiveDate: Date,
      reason: String,
      approvedBy: String,
      changedAt: { type: Date, default: Date.now }
    }],
    default: []
  })
  history: {
    base: number;
    hourlyRate: number;
    effectiveDate: Date;
    reason: string;
    approvedBy: string;
    changedAt: Date;
  }[];
}

export const SalaryProfileSchema = SchemaFactory.createForClass(SalaryProfile);
