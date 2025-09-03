import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Query, Types } from 'mongoose';
import { ApplicationStatus, ExperienceLevel, JobType } from '../../shared/enums';
import { IApplication, IApplicationDocument } from '../interfaces/application.interface';
// import { JobPosition } from '../../job-position/schemas/job-position.schema';
// import { CandidateProfile } from '../../candidate-profile/schemas/candidate-profile.schema';

// Helper interface for a simple match score detail
interface MatchScoreDetails {
  skillScore: number;
  experienceScore: number;
  keywordScore: number;
}

@Schema({
  timestamps: true, // Automatically manage createdAt and updatedAt
  collection: 'applications',
})
export class Application extends Document implements IApplication {
  @Prop({ type: Types.ObjectId, ref: 'CandidateProfile', required: true, })
  candidateProfile: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobPosition', required: true, })
  jobPosition: Types.ObjectId;

  @Prop({ required: true, trim: true })
  resumePath: string; // Path or URL to the stored resume file (specific to THIS application)

  @Prop({
    required: true,
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  
  })
  status: ApplicationStatus;

  @Prop({ type: Date, default: Date.now})
  appliedDate: Date;

  @Prop({ type: Date, default: null })
  screeningDate?: Date | null;

  @Prop({ type: Date, default: null })
  interviewDate?: Date | null;

  @Prop({ type: Date, default: null })
  hireDate?: Date | null;

  @Prop({ type: Date, default: null })
  rejectionDate?: Date | null;

  @Prop({ type: String, required: false })
  rejectionReason?: string;

  @Prop([String])
  skills?: string[]; // Skills for THIS SPECIFIC application (not general skills from profile)

  @Prop({ trim: true })
  notes?: string; // Notes specific to THIS application

  @Prop({ trim: true})
  source?: string;

  // AI-Augmented Fields
  @Prop({ type: Number, default: 0,})
  matchScore?: number; // Stores the overall match score of the application against the job

  @Prop({ type: Object })
  matchScoreDetails?: MatchScoreDetails; // Detailed breakdown of the match score

  @Prop({ trim: true })
  aiSummary?: string; // AI-generated summary of the candidate's profile/resume

  @Prop([String])
  extractedSkills?: string[]; // Skills extracted by AI from the resume

  @Prop({ type: Date, default: null })
  resumeAnalysisDate?: Date | null; // Timestamp of the last AI analysis

  @Prop({ enum: JobType, required: true })
  jobType: JobType;

  @Prop({ enum: ExperienceLevel, required: true })
  experienceLevel: ExperienceLevel;

  // Audit fields
  @Prop({ type: Types.ObjectId, ref: 'User' }) createdBy?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) updatedBy?: Types.ObjectId;
  @Prop({ type: Boolean, default: false }) isDeleted?: boolean;
  @Prop({ type: Date }) deletedAt?: Date;
  @Prop({ type: Types.ObjectId, ref: 'User' }) deletedBy?: Types.ObjectId;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

// --- Indexes and Hooks ---
// Compound unique index to prevent duplicate applications for the same job position by the same candidate
ApplicationSchema.index({ jobPosition: 1, candidateProfile: 1 }, { unique: true, sparse: true, name: 'unique_application_per_candidate_job' });

// Text index for general search on notes, source, and application-specific skills
ApplicationSchema.index({ notes: 'text', source: 'text', skills: 'text' });

// Soft delete pre-query hooks
ApplicationSchema.pre<Query<any, IApplicationDocument>>('find', function () {
  if (!(this as any).__bypassSoftDelete) {
    this.where({ isDeleted: false });
  }
});
ApplicationSchema.pre<Query<any, IApplicationDocument>>('findOne', function () {
  if (!(this as any).__bypassSoftDelete) {
    this.where({ isDeleted: false });
  }
});
ApplicationSchema.statics.withDeleted = function () {
  const query = this.find();
  (query as any).__bypassSoftDelete = true;
  return query;
};

export { IApplicationDocument };
