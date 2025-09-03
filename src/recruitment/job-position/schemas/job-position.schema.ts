// ===== 3. SCHEMA =====
// src/job-posting/schemas/job-posting.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { JobType, ExperienceLevel, WorkplaceType, JobStatus, SkillLevel } from '../../shared/enums';
import { 
  JobLocation, 
  SalaryRange, 
  ExtractedSkill, 
  JobEnrichment, 
  JobAnalytics, 
  JobSEO,
  IJobPosting,
  IJobPostingDocument 
} from '../interfaces/job-position.interface';

@Schema({ timestamps: true, collection: 'job_postings' })
export class JobPosting extends Document implements IJobPosting {

  @Prop({ required: true, trim: true, index: 'text' })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({
    type: {
      city: { type: String, required: true, trim: true, index: true },
      state: { type: String, trim: true },
      country: { type: String, required: true, trim: true, index: true },
      workplaceType: { type: String, required: true, enum: WorkplaceType, index: true }
    },
    required: true
  })
  location: JobLocation;

  @Prop({ required: true, enum: JobType, index: true })
  jobType: JobType;

  @Prop({ required: true, enum: ExperienceLevel, index: true })
  experienceLevel: ExperienceLevel;

  @Prop({
    type: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, trim: true, default: 'USD' },
      period: { type: String, required: true, enum: ['YEARLY', 'MONTHLY', 'HOURLY'], default: 'YEARLY' }
    },
    required: false
  })
  salaryRange?: SalaryRange;

  @Prop({ required: true, trim: true })
  applicationEmail: string;

  @Prop({ type: Date })
  closingDate?: Date;

  @Prop({ required: true, enum: JobStatus, default: JobStatus.DRAFT, index: true })
  status: JobStatus;

  @Prop({ type: Types.ObjectId, ref: 'companies', required: true })
  tenantId: Types.ObjectId;

  @Prop({
    type: {
      extractedAt: { type: Date, required: true },
      confidence: { type: Number, required: true, min: 0, max: 1 },
      skills: [{
        name: { type: String, required: true },
        level: { type: String, required: true, enum: SkillLevel },
        minYears: { type: Number, min: 0 },
        required: { type: Boolean, required: true },
        confidence: { type: Number, required: true, min: 0, max: 1 }
      }],
      jobFunction: { type: String, required: true, index: true },
      industry: { type: String, required: true, index: true },
      benefits: [{ type: String }],
      keywords: [{ type: String }],
      softSkills: [{ type: String }],
      urgency: { type: String, enum: ['LOW', 'STANDARD', 'HIGH', 'URGENT'], default: 'STANDARD' }
    },
    required: false
  })
  enrichment?: JobEnrichment;

  @Prop({
    type: {
      views: { type: Number, default: 0 },
      applications: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    },
    required: false
  })
  analytics?: JobAnalytics;

  @Prop({
    type: {
      slug: { type: String, required: true, unique: true },
      metaTitle: { type: String, required: true },
      metaDescription: { type: String, required: true }
    },
    required: false
  })
  seo?: JobSEO;

  createdAt?: Date;
  updatedAt?: Date;
}

export const JobPostingSchema = SchemaFactory.createForClass(JobPosting);

export { IJobPostingDocument };
