// src/recruitment/job-position/interfaces/job-position.interface.ts
import { Document, Types } from 'mongoose';
import { IBaseDocument, IPaginationQuery } from 'src/recruitment/shared/interfaces';
import { ExperienceLevel, JobStatus, JobType } from 'src/recruitment/shared/enums';

export interface IJobPosition extends IBaseDocument {
  title: string;
  description: string;
  department: object | string; // Changed to Object or string to accommodate ObjectId reference
  location: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  status: JobStatus;
  responsibilities: string[];
  requirements: string[];
  benefits?: string[];
  postedDate?: Date;
  closingDate?: Date;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  // Audit fields from IBaseDocument: createdAt, updatedAt, createdBy, updatedBy, isDeleted, deletedAt, deletedBy
}

export interface IJobPositionDocument extends IJobPosition, Document {}

// DTO Interfaces (for internal use, not directly for Mongoose)
export interface ICreateJobPositionDto {
  title: string;
  description: string;
  department: string;
  location: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  responsibilities: string[];
  requirements: string[];
  benefits?: string[];
  closingDate?: Date;
}

export interface IUpdateJobPositionDto {
  title?: string;
  description?: string;
  department?: string;
  location?: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  status?: JobStatus;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  closingDate?: Date;
}

export interface IJobPositionQuery extends IPaginationQuery {
  department?: string;
  location?: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
  salaryMin?: number;
  salaryMax?: number;
  status?: JobStatus;
  search?: string; // For general keyword search
}
