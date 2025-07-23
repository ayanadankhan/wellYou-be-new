// src/attendance/schemas/Attendance.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Date, required: false, default: null })
  checkInTime: Date;

  @Prop({ type: Date, default: null })
  checkOutTime: Date;

  @Prop({ type: Number, default: 0 })
  totalHours: number;

  @Prop({ 
    type: String, 
    enum: ['Present', 'Absent', 'Incomplete'], 
    default: 'Present' 
  })
  status: string;

  @Prop({ type: Boolean, default: false })
  isAutoCheckout: boolean;

  @Prop({ type: String, default: '' })
  remarks: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);