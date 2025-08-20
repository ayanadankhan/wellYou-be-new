// src/modules/holiday/entities/holiday.entity.ts
// This file defines the MongoDB schema for a Holiday.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define the enum-like types for the new fields
type HolidayType = 'national' | 'religious' | 'cultural' | 'regional' | 'company' | 'festival' | 'memorial' | 'bank';
type RecurringPattern = 'yearly' | 'monthly' | 'weekly' | 'custom';
type EmployeeType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'consultant';
type CompensationPolicy = 'paid' | 'unpaid' | 'optional_work' | 'premium_pay' | 'comp_off';

export type HolidayDocument = Holiday & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Holiday {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, trim: true, enum: ['national', 'religious', 'cultural', 'regional', 'company', 'festival', 'memorial', 'bank'] })
  type: HolidayType;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: false })
  isRecurring: boolean;

  @Prop({ required: false, enum: ['yearly', 'monthly', 'weekly', 'custom'] })
  recurringPattern?: RecurringPattern;

  @Prop({ default: false })
  isOptional: boolean;

  @Prop({ required: true, trim: true, enum: ['paid', 'unpaid', 'optional_work', 'premium_pay', 'comp_off'] })
  compensationPolicy: CompensationPolicy;

  @Prop({ type: [String] })
  applicableLocations: string[];

  @Prop({ type: [String] })
  applicableDepartments: string[];

  @Prop({ type: [String], index: true, enum: ['full_time', 'part_time', 'contract', 'intern', 'consultant'] })
  applicableEmployeeTypes: EmployeeType[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);

// Compound index for efficient querying
HolidaySchema.index({ date: 1, 'applicableLocations': 1, 'applicableDepartments': 1 });
