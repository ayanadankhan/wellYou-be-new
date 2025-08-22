// src/recruitment/application/schemas/application.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Query, Types } from 'mongoose';
import { ApplicationStatus } from 'src/recruitment/shared/enums';
import { IApplication, IApplicationDocument } from '../interfaces/application.interface';
import { JobPosition } from 'src/recruitment/job-position/schemas/job-position.schema';



@Schema({
  timestamps: true, // Automatically manage createdAt and updatedAt
  collection: 'applications',
})
export class Application extends Document implements IApplication {
  @Prop({ type: Types.ObjectId, ref: 'JobPosition', required: true, index: true })
  jobPosition: Types.ObjectId;

  @Prop({ required: true, trim: true })
  candidateName: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  candidateEmail: string;

  @Prop({ trim: true })
  candidatePhone?: string;

  @Prop({ required: true, trim: true })
  resumePath: string; // Path or URL to the stored resume file

  @Prop({
    required: true,
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
    index: true,
  })
  status: ApplicationStatus;

  @Prop({ type: Date, default: Date.now, index: true })
  appliedDate: Date;

  @Prop({ type: Date })
  screeningDate?: Date;

  @Prop({ type: Date })
  interviewDate?: Date;

  @Prop({ type: Date })
  hireDate?: Date;

  @Prop({ type: Date })
  rejectionDate?: Date;

  @Prop({ trim: true })
  rejectionReason?: string;

  @Prop([String])
  skills: string[];

  @Prop({ type: Number, min: 0 })
  experienceYears: number;

  @Prop({
    type: String,
    enum: ['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'],
  })
  educationLevel: 'High School' | 'Associate Degree' | 'Bachelor\'s Degree' | 'Master\'s Degree' | 'PhD';

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true, index: true })
  source?: string;

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

export const ApplicationSchema = SchemaFactory.createForClass(Application);

// Compound index to prevent duplicate applications for the same job position
ApplicationSchema.index({ jobPosition: 1, candidateEmail: 1 }, { unique: true, sparse: true, name: 'unique_application_per_job' });

// Text index for general search on candidate details and skills
ApplicationSchema.index({ candidateName: 'text', candidateEmail: 'text', skills: 'text' });

// Pre-query hook for soft delete
ApplicationSchema.pre<Query<any, IApplicationDocument>>('find', function() {
  if (!(this as any).__bypassSoftDelete) {
    this.where({ isDeleted: false });
  }
});

ApplicationSchema.pre<Query<any, IApplicationDocument>>('findOne', function() {
  if (!(this as any).__bypassSoftDelete) {
    this.where({ isDeleted: false });
  }
});


ApplicationSchema.statics.withDeleted = function() {
  const query = this.find();
  (query as any).__bypassSoftDelete = true;
  return query;
};
export { IApplicationDocument };

