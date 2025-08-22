// src/recruitment/job-position/schemas/job-position.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Query } from 'mongoose'; // <-- Import Query
import { JobStatus } from 'src/recruitment/shared/enums';
import { IJobPosition, IJobPositionDocument } from '../interfaces/job-position.interface';

@Schema({
  timestamps: true, // Automatically manage createdAt and updatedAt
  collection: 'job_positions',
})
export class JobPosition extends Document implements IJobPosition {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true, index: true })
  department: string;

  @Prop({ required: true, trim: true, index: true })
  location: string;

  @Prop({
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
    index: true,
  })
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';

  @Prop({ type: Number, min: 0 })
  salaryMin?: number;

  @Prop({ type: Number, min: 0 })
  salaryMax?: number;

  @Prop({ required: true, trim: true, default: 'USD' })
  currency: string;

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
JobPositionSchema.index({ department: 1, location: 1, employmentType: 1, status: 1 });
JobPositionSchema.index({ salaryMin: 1, salaryMax: 1 });
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
