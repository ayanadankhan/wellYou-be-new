// src/recruitment/application/interfaces/application.interface.ts

import { Document, Types } from 'mongoose';
import { IBaseDocument, IPaginationQuery } from '../../shared/interfaces';
import { ApplicationStatus, ExperienceLevel, JobType } from '../../shared/enums';
import { CreateCandidateProfileDto } from '../../candidate-profile/dto/create-candidate-profile.dto'; // Import for DTO definition

export interface IApplication extends IBaseDocument {
  // NEW: Reference to the CandidateProfile
  candidateProfile: Types.ObjectId; // Reference to CandidateProfile._id

  jobPosition: Types.ObjectId; // Reference to JobPosition._id

  resumePath: string; // Path to stored resume file for THIS specific application

  status: ApplicationStatus; // Status of THIS specific application
  appliedDate: Date;
  screeningDate?: Date | null;
  interviewDate?: Date | null; // Represents the date of the *first* interview or current stage interview
  rejectionReason?: string;
  rejectionDate?: Date | null;
  hireDate?: Date | null;
  matchScore?: number;
  jobType: JobType;
  experienceLevel: ExperienceLevel;

  skills?: string[]; // Job-specific skills provided for THIS application (optional)

  notes?: string; // Notes specific to THIS application
  source?: string; // e.g., LinkedIn, Indeed, Referral (for THIS application)
}

export interface IApplicationDocument extends IApplication, Document {}

// DTO Interfaces (for clarity, though DTO classes are preferred)
// These are not directly used as classes but represent the expected shape
export interface ICreateApplicationPayload {
  jobPositionId: string;
  candidateProfileDetails: CreateCandidateProfileDto; // Nested DTO
  resumePath: string;
  skills?: string[];
  notes?: string;
  source?: string;
}

export interface IUpdateApplicationPayload {
  status?: ApplicationStatus;
  rejectionReason?: string;
  skills?: string[];
  notes?: string;
  source?: string;
  // Potentially update dates directly if not handled by status changes
  screeningDate?: Date | null;
  interviewDate?: Date | null;
  rejectionDate?: Date | null;
  hireDate?: Date | null;
}