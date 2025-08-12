// In your entities/offboarding.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OffboardingDocument = Offboarding & Document;

// Define an enum for offboarding statuses
export enum OffboardingStatus {
  RESIGNATION_SUBMITTED = 'ResignationSubmitted',
  HR_REVIEW = 'HRReview',
  PENDING_CLEARANCES = 'PendingClearances', // Could be a general pending state for IT/Payroll/etc.
  HR_CLEARED = 'HRCleared',
  IT_CLEARED = 'ITCleared',
  PAYROLL_CLEARED = 'PayrollCleared',
  FINALIZED = 'Finalized', // All clearances done, final settlement calculated
  COMPLETED = 'Completed', // All steps done, settlement paid
  WITHDRAWN = 'Withdrawn',
  CANCELLED = 'Cancelled',
}

@Schema({ timestamps: true })
export class Offboarding {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  employeeName: string;

  @Prop()
  department: string;

  @Prop()
  position: string;

  @Prop({ type: Date })
  resignationDate: Date;

  @Prop({ type: Date })
  lastWorkingDay: Date;

  @Prop()
  noticePeriod: string;

  @Prop()
  reasonForLeaving: string;

  @Prop() // Changed to Object as Document[] might cause issues in DTO, or use string[] for file IDs/URLs
  attachments?: string; // For simplicity, if storing file metadata, define a sub-schema for Attachment

  @Prop()
  exitInterviewNotes: string;

  @Prop({ type: Boolean, default: false })
  knowledgeHandoverCompleted: boolean;

  @Prop()
  knowledgeHandoverDetails: string;

  @Prop({ type: Boolean, default: false })
  allAssetsReturned: boolean;

  @Prop({ type: [String], default: [] })
  returnedAssetsList: string[];

  @Prop()
  pendingAssets: string;

  @Prop({ type: Boolean, default: false })
  hrClearance: boolean;

  @Prop({ type: Boolean, default: false })
  itClearance: boolean;

  @Prop({ type: Boolean, default: false })
  payrollClearance: boolean;

  @Prop({ type: Number })
  finalSettlementAmount: number;

  @Prop()
  settlementNotes: string;

  @Prop({ type: Boolean, default: false })
  nonDisclosureAgreementSigned: boolean;

  @Prop({ type: Boolean, default: false })
  nonCompeteAgreementSigned: boolean;

  @Prop()
  feedbackForCompany: string;

  @Prop()
  futureContactDetails: string;

  @Prop()
  createdBy: string;

  // NEW: Add a status field
  @Prop({ type: String, enum: OffboardingStatus, default: OffboardingStatus.RESIGNATION_SUBMITTED })
  status: OffboardingStatus;
}

export const OffboardingSchema = SchemaFactory.createForClass(Offboarding);