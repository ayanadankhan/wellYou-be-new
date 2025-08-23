// src/recruitment/job-position/schemas/job-position.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Query } from 'mongoose';
import { ExperienceLevel, JobStatus, JobType } from '../../shared/enums'; // Corrected path to shared enums
import { IJobPosition, IJobPositionDocument } from '../interfaces/job-position.interface';

@Schema({
  timestamps: true, // Automatically manage createdAt and updatedAt
  collection: 'job_positions',
})
export class JobPosition extends Document implements IJobPosition {
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
  salaryMin?: number | undefined;
  salaryMax?: number | undefined;
  currency: string;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
  // ✨ IMPORTANT: Add @Prop decorators for jobType and experienceLevel
  @Prop({ required: true, enum: JobType, index: true })
  jobType: JobType;

  @Prop({ required: true, enum: ExperienceLevel, index: true })
  experienceLevel: ExperienceLevel;

  // Remove explicit createdAt and updatedAt declarations; timestamps: true handles these
  // createdAt?: Date | undefined;
  // updatedAt?: Date | undefined;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true, index: true })
  department: string;

  @Prop({ required: true, trim: true, index: true })
  location: string;

  // ✨ REMOVED: employmentType, as it's replaced by jobType from enum
  // @Prop({
  //   required: true,
  //   enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
  //   index: true,
  // })
  // employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';

  // ✨ IMPORTANT: Use a nested object for salaryRange to match DTO
  @Prop({
    type: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, trim: true, default: 'USD' },
      period: { type: String, required: true, enum: ['yearly', 'monthly', 'hourly'] }, // Add period enum
    },
    required: false, // Make the entire salaryRange object optional if the DTO sends it as optional
  })
  salaryRange?: { // Type definition matches the object structure
    min: number;
    max: number;
    currency: string;
    period: 'yearly' | 'monthly' | 'hourly';
  };

  // Removed direct salaryMin, salaryMax, currency
  // @Prop({ type: Number, min: 0 })
  // salaryMin?: number;

  // @Prop({ type: Number, min: 0 })
  // salaryMax?: number;

  // @Prop({ required: true, trim: true, default: 'USD' })
  // currency: string;

  @Prop({ required: true, enum: JobStatus, default: JobStatus.DRAFT, index: true })
  status: JobStatus;

  @Prop([String]) // Array of strings
  responsibilities: string[];

  @Prop([String]) // Array of strings
  requirements: string[];

  @Prop([String]) // Optional array of strings
  benefits?: string[];

  @Prop({ type: Date, default: Date.now })
  postedDate?: Date;

  @Prop({ type: Date })
  closingDate?: Date;

  // Audit fields (handled by Mongoose timestamps for createdAt/updatedAt)
  @Prop({ type: Types.ObjectId, ref: 'User', index: true }) // Assuming 'User' model for createdBy
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

export const JobPositionSchema = SchemaFactory.createForClass(JobPosition);

// Add indexes for efficient querying
JobPositionSchema.index({ title: 'text', description: 'text', department: 'text', location: 'text' });
// Revisit this index, employmentType is removed. Consider adding jobType and experienceLevel
// JobPositionSchema.index({ department: 1, location: 1, employmentType: 1, status: 1 });
JobPositionSchema.index({ department: 1, location: 1, jobType: 1, experienceLevel: 1, status: 1 }); // ✨ Updated Index
JobPositionSchema.index({ 'salaryRange.min': 1, 'salaryRange.max': 1 }); // ✨ Updated Index for nested salary
JobPositionSchema.index({ postedDate: -1 });

// Pre-query hook for soft delete
// Correctly type 'this' as a Mongoose Query object
JobPositionSchema.pre<Query<any, IJobPositionDocument>>('find', function() {
  if (!(this as any).__bypassSoftDelete) { // Allow explicit bypass for admin operations
    this.where({ isDeleted: false });
  }
});
JobPositionSchema.pre<Query<any, IJobPositionDocument>>('findOne', function() {
  if (!(this as any).__bypassSoftDelete) {
    this.where({ isDeleted: false });
  }
});

// Method to bypass soft delete for specific queries (e.g., admin retrieving all)
JobPositionSchema.statics.withDeleted = function() {
  const query = this.find();
  (query as any).__bypassSoftDelete = true;
  return query;
};

export { IJobPositionDocument };