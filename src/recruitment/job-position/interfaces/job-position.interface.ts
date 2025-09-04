// src/job-posting/interfaces/job-posting.interface.ts
import { Document, Types } from 'mongoose';
import { JobType, ExperienceLevel, WorkplaceType, JobStatus, SkillLevel } from '../../shared/enums';

export interface JobLocation {
  city: string;
  state?: string;
  country: string;
  workplaceType: WorkplaceType;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'YEARLY' | 'MONTHLY' | 'HOURLY';
}

export interface ExtractedSkill {
  name: string;
  level: SkillLevel;
  minYears?: number;
  required: boolean;
  confidence: number;
}

export interface JobEnrichment {
  extractedAt: Date;
  confidence: number;
  skills: ExtractedSkill[];
  jobFunction: string;
  industry: string;
  benefits: string[];
  keywords: string[];
  softSkills: string[];
  urgency: 'LOW' | 'STANDARD' | 'HIGH' | 'URGENT';
}

export interface JobAnalytics {
  views: number;
  applications: number;
  saves: number;
  shares: number;
}

export interface JobSEO {
  slug: string;
  metaTitle: string;
  metaDescription: string;
}

export interface IJobPosting {
  title: string;
  description: string;
  location: JobLocation;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryRange?: SalaryRange;
  applicationEmail: string;
  closingDate?: Date;
  status: JobStatus;
  tenantId: Types.ObjectId;
  enrichment?: JobEnrichment;
  analytics?: JobAnalytics;
  seo?: JobSEO;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJobPostingDocument extends IJobPosting, Document {
  [x: string]: any;
}