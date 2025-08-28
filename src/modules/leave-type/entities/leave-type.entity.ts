import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaveTypeDocument = LeaveType & Document;

@Schema({
  timestamps: true,
  collection: 'leave_types'
})
export class LeaveType {
  @Prop({ type: Types.ObjectId, ref: 'companies', required: true })
  tenantId: Types.ObjectId;
  
  @Prop({ required: true, maxlength: 100, unique: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ default: 0, min: 0 })
  maximumDays: number;

  @Prop({ default: 'blue' })
  color: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: true })
  requiresApproval: boolean;

  @Prop({ default: false })
  allowPartialDays: boolean;

  @Prop({ default: false })
  carryOverAllowed: boolean;
}

export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);