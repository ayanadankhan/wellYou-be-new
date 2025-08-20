import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PerformanceReviewDocument = PerformanceReview & Document;

// --- Sub-schemas for nested structures ---

@Schema({ _id: false })
class Certification {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  verificationUrl: string;
}

@Schema({ _id: false })
class Skill {
  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'], required: true })
  level: string;
}

@Schema({ _id: false })
class EmployeeSnapshot {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  profilePicture: string;

  @Prop({ required: true })
  designation: string;

  @Prop({ required: true })
  joiningDate: string; // store as string ISO date

  @Prop({ required: true })
  totalJobDuration: string;

  @Prop({ required: true })
  totalExperience: string;

  @Prop({ type: [Certification], default: [] })
  certifications: Certification[];

  @Prop({ type: [Skill], default: [] })
  skills: Skill[];
}

@Schema({ _id: false })
class AttendanceSummary {
  @Prop({ required: true })
  totalWorkingDays: number;

  @Prop({ required: true })
  presentDays: number;

  @Prop({ required: true })
  absentDays: number;

  @Prop({ required: true })
  lateCheckins: number;
}

@Schema({ _id: false })
class LeaveByType {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  count: number;
}

@Schema({ _id: false })
class LeaveSummary {
  @Prop({ required: true })
  totalLeaves: number;

  @Prop({ type: [LeaveByType], default: [] })
  byType: LeaveByType[];
}

@Schema({ _id: false })
class Rating {
  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  score: number;

  @Prop()
  comment?: string;
}

@Schema({ _id: false })
class SalaryAtReview {
  @Prop({ required: true })
  basePay: number;

  @Prop({ required: true })
  currency: string;
}

// --- Main Schema ---
@Schema({ timestamps: true })
export class PerformanceReview {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employeeId: Types.ObjectId;

  @Prop({ enum: ['Q1', 'Q2', 'Q3', 'Q4', 'Annual'], required: true })
  reviewPeriod: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual';

  @Prop({ required: true })
  reviewDate: string; // ISO date

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reviewerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Position', required: true })
  positionId: Types.ObjectId;

  @Prop({ type: EmployeeSnapshot, required: true })
  employeeSnapshot: EmployeeSnapshot;

  @Prop({ type: AttendanceSummary, required: true })
  attendanceSummary: AttendanceSummary;

  @Prop({ type: LeaveSummary, required: true })
  leaveSummary: LeaveSummary;

  @Prop({ type: [Rating], default: [] })
  ratings: Rating[];

  @Prop({ required: true })
  overallRating: number;

  @Prop({ required: true })
  taskCompletionRate: number;

  @Prop({ required: true })
  wellBeingScore: number;

  @Prop({ type: [Certification], default: [] })
  newCertifications: Certification[];

  @Prop({ type: SalaryAtReview, required: true })
  salaryAtReview: SalaryAtReview;

  @Prop({ required: true })
  marketBenchmark: number;

  @Prop({ required: true })
  marketDifference: number;

  @Prop({ required: true })
  managerComments: string;

  @Prop({ required: true })
  hrComments: string;

  @Prop({ enum: ['INCREMENT', 'PIP', 'PROMOTION', 'NO_ACTION'], required: true })
  recommendedAction: 'INCREMENT' | 'PIP' | 'PROMOTION' | 'NO_ACTION';

  @Prop({ required: true })
  incrementPercentage: number;
}

export const PerformanceReviewSchema = SchemaFactory.createForClass(PerformanceReview);
