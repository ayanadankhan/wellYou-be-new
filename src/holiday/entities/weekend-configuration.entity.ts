// src/modules/holiday/entities/weekend-configuration.entity.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define enum for days of the week
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Re-using EmployeeType from holiday.entity for consistency
type EmployeeType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'consultant';

export type WeekendConfigurationDocument = WeekendConfiguration & Document;

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
export class WeekendConfiguration {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string; // e.g., "Standard Weekend", "Friday-Saturday Weekend"

  @Prop({
    type: [String],
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  })
  weekendDays: DayOfWeek[]; // e.g., ['saturday', 'sunday'] or ['friday', 'saturday']

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ type: [String], default: [] })
  applicableDepartments: string[]; // Departments this configuration applies to

  @Prop({
    type: [String],
    
    enum: ['full_time', 'part_time', 'contract', 'intern', 'consultant'],
    default: [],
  })
  applicableEmployeeTypes: EmployeeType[]; // Employee types this configuration applies to

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const WeekendConfigurationSchema = SchemaFactory.createForClass(WeekendConfiguration);

// Add an index for efficient querying by departments and employee types
WeekendConfigurationSchema.index({ 'applicableDepartments': 1, 'applicableEmployeeTypes': 1 });