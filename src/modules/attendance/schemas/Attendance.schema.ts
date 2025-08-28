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
    enum: ['Present', 'Absent', 'Incomplete', 'Leave'], 
    default: 'Present' 
  })
  status: string;

  @Prop({ type: Boolean, default: false })
  isAutoCheckout: boolean;

   @Prop({ default: false })
  isManual: boolean;

  @Prop({ type: String, default: '' })
  remarks: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId;

  // 🔹 audit history
  @Prop({
    type: [
      {
        checkInTime: Date,
        checkOutTime: Date,
        totalHours: Number,
        status: String,
        isAutoCheckout: Boolean,
        isManual: Boolean,
        remarks: String,
        updatedAt: Date,
        updatedBy: { type: Types.ObjectId, ref: 'User' },
      },
    ],
    default: [],
  })
  audit: Record<string, any>[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);