import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  HolidayType,
  RecurringPattern,
  EmployeeType,
  DayOfWeek,
} from '../dto/create-holiday.dto';

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

  @Prop({
    required: true,
    trim: true,
    enum: [
      'national',
      'religious',
      'cultural',
      'regional',
      'company',
      'festival',
      'memorial',
      'bank',
      'weekend',
    ],
  })
  type: HolidayType;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ required: false })
  date?: Date;

  @Prop({ default: false })
  isRecurring: boolean;

  @Prop({ required: false, enum: ['yearly', 'monthly', 'weekly', 'custom'] })
  recurringPattern?: RecurringPattern;

  @Prop({ type: [String], default: [] })
  location: string[];

  @Prop({ type: [String], default: [] })
  applicableDepartments: string[];

  @Prop({
    type: [String],
    enum: ['full_time', 'part_time', 'contract', 'intern', 'consultant'],
    default: [],
  })
  applicableEmployeeTypes: EmployeeType[];

  @Prop({
    type: [String],
    enum: [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ],
    default: [],
  })
  days?: DayOfWeek[];

  @Prop({ type: Types.ObjectId, ref: 'companies', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);

