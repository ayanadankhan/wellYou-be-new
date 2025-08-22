// src/recruitment/interview/schemas/interview.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Query, Types } from 'mongoose';
import { InterviewType } from 'src/recruitment/shared/enums';
import { IInterview, IInterviewDocument, IInterviewer } from '../interfaces/interview.interface';
import { Application } from 'src/recruitment/application/schemas/application.schema';
import { JobPosition } from 'src/recruitment/job-position/schemas/job-position.schema';

// src/recruitment/interview/schemas/interview.schema.ts



// First, define the Mongoose Schema for the Interviewer subdocument
// This maps your IInterviewer interface to a Mongoose schema structure.
@Schema({ _id: false }) // _id: false means Mongoose won't create a default _id for each interviewer in the array
export class InterviewerSchemaClass implements IInterviewer {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true }) // Assuming role is always present for an interviewer
  role: string;

  @Prop()
  feedback?: string;

  @Prop({ type: Number })
  rating?: number;
}

export const InterviewerSubSchema = SchemaFactory.createForClass(InterviewerSchemaClass);

@Schema({
  timestamps: true,
  collection: 'interviews',
})
export class Interview extends Document implements IInterview {
  @Prop({ type: Types.ObjectId, ref: 'Application', required: true, index: true })
  application: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobPosition', required: true, index: true })
  jobPosition: Types.ObjectId;

  @Prop({ type: [InterviewerSubSchema], required: true }) // Define as an array of InterviewerSubSchema
  interviewers: IInterviewer[];

  @Prop({ type: Date, required: true, index: true })
  scheduledDate: Date;

  @Prop({ required: true, trim: true, match: /^\d{2}:\d{2}$/ }) // HH:MM format
  startTime: string;

  @Prop({ required: true, trim: true, match: /^\d{2}:\d{2}$/ }) // HH:MM format
  endTime: string;

  @Prop({ required: true, enum: InterviewType, index: true })
  type: InterviewType;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  overallFeedback?: string;

  @Prop({ type: Number, min: 1, max: 5 })
  overallRating?: number;

  @Prop({
    required: true,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled',
    index: true,
  })
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';

  // Audit fields
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted?: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);

// Indexes for common queries
InterviewSchema.index({ application: 1, scheduledDate: 1 });
InterviewSchema.index({ jobPosition: 1, status: 1 });
InterviewSchema.index({ 'interviewers.userId': 1 }); // Index for searching by interviewer

// Text index for general search on notes and interviewer names/emails
InterviewSchema.index({ notes: 'text', 'interviewers.name': 'text', 'interviewers.email': 'text' });

// Pre-query hook for soft delete
InterviewSchema.pre<Query<any, IInterviewDocument>>('find', function() {
  if (!(this as any).__bypassSoftDelete) {
    this.where({ isDeleted: false });
  }
});

InterviewSchema.pre<Query<any, IInterviewDocument>>('findOne', function() {
  if (!(this as any).__bypassSoftDelete) {
    this.where({ isDeleted: false });
  }
});

InterviewSchema.statics.withDeleted = function() {
  const query = this.find();
  (query as any).__bypassSoftDelete = true;
  return query;
};
export { IInterviewDocument };

