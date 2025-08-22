// src/recruitment/application/interfaces/application.interface.ts
import { Document, Types } from 'mongoose';
import { IBaseDocument, IPaginationQuery } from 'src/recruitment/shared/interfaces';
import { ApplicationStatus } from 'src/recruitment/shared/enums';

export interface IApplication extends IBaseDocument {
  jobPosition: Types.ObjectId; // Reference to JobPosition
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  resumePath: string; // Path to stored resume file
  status: ApplicationStatus;
  appliedDate: Date;
  screeningDate?: Date;
  interviewDate?: Date; // To be managed by Interview module
   rejectionReason?: string | null; // <-- Change 'undefined' to 'null' here
  rejectionDate?: Date | null;    // <-- Ensure rejectionDate also allows null
  hireDate?: Date | null;         // <-- Ensure hireDate also allows null
  skills: string[];
  experienceYears: number;
  educationLevel: 'High School' | 'Associate Degree' | 'Bachelor\'s Degree' | 'Master\'s Degree' | 'PhD';
  notes?: string;
  source?: string; // e.g., LinkedIn, Indeed, Referral
  // Audit fields from IBaseDocument
}

export interface IApplicationDocument extends IApplication, Document {}

// DTO Interfaces
export interface ICreateApplicationDto {
  jobPositionId: string; // String to accept ObjectId as string from client
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  skills: string[];
  experienceYears: number;
  educationLevel: 'High School' | 'Associate Degree' | 'Bachelor\'s Degree' | 'Master\'s Degree' | 'PhD';
  notes?: string;
  source?: string;
}

export interface IUpdateApplicationDto {
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  status?: ApplicationStatus;
  rejectionReason?: string;
  skills?: string[];
  experienceYears?: number;
  educationLevel?: 'High School' | 'Associate Degree' | 'Bachelor\'s Degree' | 'Master\'s Degree' | 'PhD';
  notes?: string;
  source?: string;
}

export interface IApplicationQuery extends IPaginationQuery {
  jobPositionId?: string;
  status?: ApplicationStatus;
  candidateName?: string;
  candidateEmail?: string;
  skills?: string[]; // Comma-separated list of skills
  minExperience?: number;
  educationLevel?: 'High School' | 'Associate Degree' | 'Bachelor\'s Degree' | 'Master\'s Degree' | 'PhD';
  search?: string; // General keyword search
  appliedDateFrom?: string;
  appliedDateTo?: string;
}
