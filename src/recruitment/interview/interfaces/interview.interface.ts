// src/recruitment/interview/interfaces/interview.interface.ts
import { Document, Types } from 'mongoose';
import { IBaseDocument, IPaginationQuery } from 'src/recruitment/shared/interfaces';
import { InterviewType } from 'src/recruitment/shared/enums';

// Represents an individual interviewer on an interview panel
export interface IInterviewer {
  userId: Types.ObjectId; // Reference to a User module ID (e.g., employee ID)
  name: string; // Interviewer's name for easy display
  email: string; // Interviewer's email
  role: string; // e.g., 'Hiring Manager', 'Team Lead', 'HR'
  feedback?: string;
  rating?: number; // e.g., 1-5 scale
  // Additional fields like availability, calendar integration ID could go here
}

export interface IInterview extends IBaseDocument {
  application: Types.ObjectId; // Reference to the Application
  jobPosition: Types.ObjectId; // Reference to the JobPosition (for quick access)
  interviewers: IInterviewer[];
  scheduledDate: Date;
  startTime: string; // e.g., "10:00"
  endTime: string; // e.g., "11:00"
  type: InterviewType;
  location?: string; // Physical location or virtual meeting link
  notes?: string;
  overallFeedback?: string;
  overallRating?: number; // Aggregated rating from all interviewers or lead
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  // Audit fields from IBaseDocument
}

export interface IInterviewDocument extends IInterview, Document {}

// DTO Interfaces
export interface ICreateInterviewerDto {
  userId: string; // As string from client
  name: string;
  email: string;
  role: string;
}

export interface ICreateInterviewDto {
  applicationId: string; // String to accept ObjectId as string from client
  jobPositionId: string; // String to accept ObjectId as string from client
  interviewers: ICreateInterviewerDto[];
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  type: InterviewType;
  location?: string;
  notes?: string;
}

export interface IUpdateInterviewerDto {
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  feedback?: string;
  rating?: number;
}

export interface IUpdateInterviewDto {
  interviewers?: IUpdateInterviewerDto[];
  scheduledDate?: Date;
  startTime?: string;
  endTime?: string;
  type?: InterviewType;
  location?: string;
  notes?: string;
  overallFeedback?: string;
  overallRating?: number;
  status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
}

export interface IInterviewQuery extends IPaginationQuery {
  applicationId?: string;
  jobPositionId?: string;
  interviewerId?: string; // Filter by a specific interviewer's userId
  type?: InterviewType;
  status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  search?: string; // General keyword search on notes, interviewer names/emails
}
