// src/recruitment/shared/enums.ts

export enum JobStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ON_HOLD = 'ON_HOLD',
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED",
  PROCEED_TO_NEXT_ROUND = "PROCEED_TO_NEXT_ROUND",
  SCREENED = "SCREENED",
}

export enum InterviewType {
  PHONE = 'PHONE',
  VIDEO = 'VIDEO',
  IN_PERSON = 'IN_PERSON',
  TECHNICAL = 'TECHNICAL',
}

export enum FileType {
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
