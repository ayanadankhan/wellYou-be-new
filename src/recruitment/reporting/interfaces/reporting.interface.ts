// src/recruitment/reporting/interfaces/reporting.interface.ts
import { IPaginationQuery } from 'src/recruitment/shared/interfaces';
import { ApplicationStatus, InterviewType } from 'src/recruitment/shared/enums';

// DTO Interfaces for Reporting Queries
export interface IRecruitmentMetricsQuery {
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  jobPositionId?: string;
  department?: string;
}

// Interface for Applications Overview Report
export interface IApplicationsOverview {
  totalApplications: number;
  applicationsByStatus: {
    [status in ApplicationStatus]?: number;
  };
  applicationsByJobPosition: {
    jobPositionId: string;
    title: string;
    count: number;
  }[];
  applicationsBySource: {
    source: string;
    count: number;
  }[];
  avgExperienceYears?: number;
}

// Interface for Interview Success Rate Report
export interface IInterviewSuccessRate {
  totalInterviewsScheduled: number;
  totalInterviewsCompleted: number;
  interviewsByType: {
    [type in InterviewType]?: number;
  };
  hiredFromInterview: number; // Applications that reached 'HIRED' status after an interview
  successRate: number; // (hiredFromInterview / totalInterviewsCompleted) * 100
}

// Interface for Time-to-Hire Report
export interface ITimeToHire {
  totalHiredApplications: number;
  avgTimeToHireDays: number; // Average days from appliedDate to hireDate
  medianTimeToHireDays?: number; // Median days
  timeToHireByJobPosition?: {
    jobPositionId: string;
    title: string;
    avgDays: number;
  }[];
  timeToHireByDepartment?: {
    department: string;
    avgDays: number;
  }[];
}

// Interface for a combined recruitment dashboard summary
export interface IRecruitmentDashboardSummary {
  applicationsOverview: IApplicationsOverview;
  interviewSuccessRate: IInterviewSuccessRate;
  timeToHire: ITimeToHire;
  // Add more summary metrics here as needed
}
