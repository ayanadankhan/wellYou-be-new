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

  @Prop({ required: true })
  leaveType: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: false })
  isHalfDay: boolean;

  @Prop({ required: false, maxlength: 500 })
  reason?: string;

  @Prop({ type: [String], default: [] }) // Array of file paths or URLs
  documents: string[];

  @Prop({ 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: false })
  approvedById?: Types.ObjectId;

  @Prop({ required: false })
  approvedAt?: Date;

  @Prop({ default: 0, min: 0 })
  usedDays: number;

  @Prop({ required: false, maxlength: 500 })
  rejectionReason?: string;

  @Prop({ default: 0 })
  daysCount: number; // Calculated field for total days


  @Prop({ default: false })
  isCarriedOver: boolean;


}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

// Add index for better query performance
LeaveRequestSchema.index({ employeeId: 1 });
LeaveRequestSchema.index({ leaveType: 1 });
LeaveRequestSchema.index({ startDate: 1 });
LeaveRequestSchema.index({ endDate: 1 });
LeaveRequestSchema.index({ status: 1 });