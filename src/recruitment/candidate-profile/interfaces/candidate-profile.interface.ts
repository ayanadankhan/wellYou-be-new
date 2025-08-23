// src/recruitment/candidate-profile/interfaces/candidate-profile.interface.ts

import { Document, Types } from 'mongoose';
import { IBaseDocument } from '../../shared/interfaces'; // Ensure this path is correct

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

export enum EducationLevel {
  HIGHSCHOOL = 'HIGH_SCHOOL',
  ASSOCIATE = 'ASSOCIATE_DEGREE',
  BACHELOR = 'BACHELOR_DEGREE',
  MASTER = 'MASTER_DEGREE',
  PHD = 'PHD',
  DIPLOMA = 'DIPLOMA', // Added common diploma option
  VOCATIONAL = 'VOCATIONAL', // Added vocational training option
}

export interface IContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface IDependentMember {
  name: string;
  relationship: string;
  dateOfBirth: Date;
}

export interface IEducationEntry {
  level: EducationLevel;
  degree: string;
  institution: string;
  fieldOfStudy?: string; // Made optional as per real-world data
  graduationYear?: number; // Made optional, can be inferred or not applicable
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

export interface IExperienceEntry {
  jobTitle: string;
  company: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  isCurrent?: boolean;
}

export interface ICertification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  credentialId?: string;
  credentialUrl?: string; // Added for completeness
}

export interface IDocument {
  documentName: string;
  documentType: string;
  filePath: string; // URL or path to the stored document
  uploadedAt: Date;
  expiresAt?: Date;
}

// Main Candidate Profile Interface
export interface ICandidateProfile extends IBaseDocument {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string; // Made optional as per DTO
  userId?: Types.ObjectId; // Link to an existing user if they have an account

  dateOfBirth?: Date;
  profilePicture?: string; // URL to profile picture
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  location?: string; // e.g., City, Country
  nationality?: string;

  emergencyContact?: IContact;
  dependentMembers?: IDependentMember[];
  education?: IEducationEntry[];
  experiences?: IExperienceEntry[];
  certifications?: ICertification[];
  documents?: IDocument[];

  generalSkills?: string[]; // Broader skills list for the profile
  resumeUrl?: string; // Default resume URL for the profile (renamed for clarity)
  linkedInProfile?: string; // Added for professional profiles
  portfolioUrl?: string; // Added for creative/technical portfolios
  githubProfile?: string; // Added for developers

  notes?: string; // Internal notes about the candidate
  source?: string; // How this candidate was found (e.g., LinkedIn, Referral)
  overallExperienceYears?: number; // Total years of professional experience
  salaryExpectation?: {
    amount: number;
    currency: string;
    period: 'yearly' | 'monthly' | 'hourly';
  }; // Added for common recruitment field
  isAvailableForRemote?: boolean;
  preferredJobTitles?: string[];
  preferredLocations?: string[];
}

export interface ICandidateProfileDocument extends ICandidateProfile, Document {}