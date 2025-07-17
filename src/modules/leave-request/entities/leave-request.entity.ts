import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaveRequestDocument = LeaveRequest & Document;

@Schema({
  timestamps: true,
  collection: 'leave_requests'
})
export class LeaveRequest {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['leave', 'timeOff', 'overtime'],
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
    },
    required: false,
  })
  leaveDetails?: {
    leaveType?: string;
    reason?: string;
    from?: Date;
    to?: Date;
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
      totalHour: { type: Number, required: false },
    },
    required: false,
  })
  overtimeDetails?: {
    reason?: string;
    fromHour?: string;
    toHour?: string;
    totalHour?: number;
  };

  // Workflow management
  @Prop({
    type: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      actionBy: { type: String, required: false },
      actionDate: { type: Date, required: false },
      rejectionReason: { type: String, required: false },
    },
    default: {
      status: 'pending',
    },
  })
  workflow: {
    status: string;
    actionBy?: string;
    actionDate?: Date;
    rejectionReason?: string;
  };
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

// Add indexes for better query performance
LeaveRequestSchema.index({ employeeId: 1 });
LeaveRequestSchema.index({ type: 1 });
LeaveRequestSchema.index({ appliedDate: 1 });
LeaveRequestSchema.index({ 'workflow.status': 1 });
LeaveRequestSchema.index({ 'leaveDetails.from': 1 });
LeaveRequestSchema.index({ 'leaveDetails.to': 1 });