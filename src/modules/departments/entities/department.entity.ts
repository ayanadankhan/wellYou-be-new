import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Document, Types } from "mongoose";

export enum DepartmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MERGED = 'MERGED',
}

@Schema({ timestamps: true })
export class Department extends Document {
  @Prop({ required: true, unique: true })
  departmentCode: string;

  @Prop({ required: true })
  departmentName: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department', required: false })
  parentDepartmentId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee', required: false })
  departmentHeadId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, default: 0 })
  budgetAllocated: number;

  @Prop({ required: true })
  costCenterCode: string;

  @Prop({ required: true })
  establishedDate: Date;

  @Prop({ 
    required: true, 
    enum: DepartmentStatus,
    default: DepartmentStatus.ACTIVE 
  })
  status: DepartmentStatus;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);