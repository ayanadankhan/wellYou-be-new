import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RequestStatus, RequestType } from '../dto/create-request-mangment.dto';

export type RequestMangmentDocument = RequestMangment & Document;

@Schema({
  timestamps: true,
  collection: 'request_management',
})
export class RequestMangment {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(RequestType),
    required: true,
  })
  type: string;

  @Prop({ type: Date, default: Date.now })
  appliedDate: Date;

  // Leave specific details
  @Prop({
    type: {
      leaveType: { type: String, required: false },
      reason: { type: String, required: false },
      from: { type: Date, required: false },
      to: { type: Date, required: false },
      totalHour: { type: Number, required: false },
    },
    required: false,
  })
  leaveDetails?: {
    leaveType?: string;
    reason?: string;
    from?: Date;
    to?: Date;
    totalHour?: number;
  };

  // Time off specific details
  @Prop({
    type: {
      reason: { type: String, required: false },
      fromHour: { type: String, required: false }, // e.g., "14:00"
      toHour: { type: String, required: false },
      totalHour: { type: Number, required: false },
    },
    required: false,
  })
  timeOffDetails?: {
    reason?: string;
    fromHour?: string;
    toHour?: string;
    totalHour?: number;
  };

  // Overtime specific details
  @Prop({
    type: {
      reason: { type: String, required: false },
      fromHour: { type: String, required: false },
      toHour: { type: String, required: false },
      date: { type: Date, required: false },
      totalHour: { type: Number, required: false },
    },
    required: false,
  })
  overtimeDetails?: {
    reason?: string;
    fromHour?: string;
    toHour?: string;
    date?: Date;
    totalHour?: number;
  };

  @Prop({
    type: {
      reason: { type: String, required: false },
      checkInTime: { type: String, required: false },
      checkOutTime: { type: String, required: false },
      attendanceId: { type: String, required: false },
    },
    required: false,
  })
  attendanceDetails?: {
    reason?: string;
    checkInTime?: string;
    checkOutTime?: string;
    attendanceId?: string;
  };

  @Prop({
    type: {
      loanAmount: { type: Number, required: false },
      loanType: { type: String, required: false },
      loanDuration: { type: String, required: false },
      loanPurpose: { type: String, required: false },
      installmentAmount: { type: Number, required: false },
    },
    required: false,
  })
  loanDetails?: {
    loanAmount?: number;
    loanType?: string;
    loanDuration?: string;
    loanPurpose?: string;
    installmentAmount?: number;
  };

  // Workflow management
  @Prop({
    type: {
      status: {
        type: String,
        enum: Object.values(RequestStatus), // Using enum here too
        default: RequestStatus.PENDING,
      },
      actionBy: { type: String, required: false },
      actionDate: { type: Date, required: false },
      rejectionReason: { type: String, required: false },
      modifications: { type: Object, required: false },
    },
    default: {
      status: RequestStatus.PENDING,
    },
  })
  workflow: {
    status: string;
    actionBy?: string;
    actionDate?: Date;
    rejectionReason?: string;
    modifications?: Object;
  };
}

export const requestMangmentchema = SchemaFactory.createForClass(RequestMangment);

// Add indexes for better query performance
requestMangmentchema.index({ employeeId: 1 });
requestMangmentchema.index({ type: 1 });
requestMangmentchema.index({ appliedDate: 1 });
requestMangmentchema.index({ 'workflow.status': 1 });
requestMangmentchema.index({ 'leaveDetails.from': 1 });
requestMangmentchema.index({ 'leaveDetails.to': 1 });