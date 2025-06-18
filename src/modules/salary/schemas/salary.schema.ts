import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Sub-schemas for better organization
@Schema({ _id: false })
export class SalaryComponent {
  @Prop({ required: true, type: Types.ObjectId })
  titleId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: '' })
  description: string;
}

@Schema({ _id: false })
export class PaymentMethod {
  @Prop({ required: true, enum: ['bank_transfer', 'check', 'cash', 'direct_deposit'] })
  type: string;

  @Prop()
  bankName: string;

  @Prop()
  accountNumber: string;

  @Prop()
  routingNumber: string;

  @Prop()
  swiftCode: string;
}

@Schema({ _id: false })
export class SalaryStructure {
  @Prop({ required: true, min: 0 })
  baseSalary: number;

  @Prop({ min: 0 })
  hourlyRate: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true, enum: ['monthly', 'bi-weekly', 'weekly', 'daily', 'hourly'] })
  payFrequency: string;

  @Prop({ type: [SalaryComponent], default: [] })
  additions: SalaryComponent[];

  @Prop({ type: [SalaryComponent], default: [] })
  deductions: SalaryComponent[];

  @Prop({ type: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ required: true })
  effectiveDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ default: 'active', enum: ['active', 'inactive', 'terminated'] })
  status: string;

  @Prop()
  reason: string;

  @Prop()
  approvedBy: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  createdBy: string;
}

@Schema({ timestamps: true })
export class Salary extends Document {
  @Prop({ required: true, type: Types.ObjectId, unique: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  employeeName: string;

  @Prop({ required: true })
  employeeCode: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true })
  position: string;

  // Current active salary structure
  @Prop({ type: SalaryStructure, required: true })
  currentSalary: SalaryStructure;

  // Complete salary history
  @Prop({ type: [SalaryStructure], default: [] })
  salaryHistory: SalaryStructure[];

  // Computed fields
  @Prop()
  currentGrossPay: number;

  @Prop()
  currentNetPay: number;

  @Prop({ default: 'active', enum: ['active', 'inactive', 'terminated'] })
  employmentStatus: string;

  @Prop()
  lastModifiedBy: string;
}

export const SalarySchema = SchemaFactory.createForClass(Salary);

// Add indexes for better performance
SalarySchema.index({ employeeId: 1 });
SalarySchema.index({ employeeCode: 1 });
SalarySchema.index({ 'currentSalary.effectiveDate': -1 });