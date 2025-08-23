// src/recruitment/candidate-profile/schemas/candidate-profile.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Query } from 'mongoose';
import {
  ICandidateProfile,
  ICandidateProfileDocument,
  Gender,
  MaritalStatus,
  EducationLevel,
  IContact,
  IDependentMember,
  IEducationEntry,
  IExperienceEntry,
  ICertification,
  IDocument,
} from '../interfaces/candidate-profile.interface';

// --- Nested Schemas for Arrays/Objects (subdocuments without _id) ---
@Schema({ _id: false })
class ContactSchemaClass implements IContact {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) relationship: string;
  @Prop({ required: true }) phoneNumber: string;
  @Prop() email?: string;
}
const ContactSubSchema = SchemaFactory.createForClass(ContactSchemaClass);

@Schema({ _id: false })
class DependentMemberSchemaClass implements IDependentMember {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) relationship: string;
  @Prop({ required: true }) dateOfBirth: Date;
}
const DependentMemberSubSchema = SchemaFactory.createForClass(DependentMemberSchemaClass);

@Schema({ _id: false })
class EducationEntrySchemaClass implements IEducationEntry {
  @Prop({ required: true, enum: Object.values(EducationLevel) })
  level: EducationLevel;

  @Prop({ required: true })
  degree: string;

  @Prop({ required: true })
  institution: string;

  @Prop()
  fieldOfStudy?: string;

  @Prop()
  graduationYear?: number;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  notes?: string;
}
const EducationEntrySubSchema = SchemaFactory.createForClass(EducationEntrySchemaClass);

@Schema({ _id: false })
class ExperienceEntrySchemaClass implements IExperienceEntry {
  @Prop({ required: true }) jobTitle: string;
  @Prop({ required: true }) company: string;
  @Prop({ required: true }) startDate: Date;
  @Prop() endDate?: Date;
  @Prop() description?: string;
  @Prop({ default: false }) isCurrent?: boolean;
}
const ExperienceEntrySubSchema = SchemaFactory.createForClass(ExperienceEntrySchemaClass);

@Schema({ _id: false })
class CertificationSchemaClass implements ICertification {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) issuingOrganization: string;
  @Prop({ required: true }) issueDate: Date;
  @Prop() expirationDate?: Date;
  @Prop() credentialId?: string;
  @Prop() credentialUrl?: string;
}
const CertificationSubSchema = SchemaFactory.createForClass(CertificationSchemaClass);

@Schema({ _id: false })
class DocumentSchemaClass implements IDocument {
  @Prop({ required: true }) documentName: string;
  @Prop({ required: true }) documentType: string;
  @Prop({ required: true }) filePath: string;
  @Prop({ required: true }) uploadedAt: Date;
  @Prop() expiresAt?: Date;
}
const DocumentSubSchema = SchemaFactory.createForClass(DocumentSchemaClass);

@Schema({ _id: false })
class SalaryExpectationSchemaClass {
  @Prop({ required: true }) amount: number;
  @Prop({ required: true }) currency: string;
  @Prop({ required: true, enum: ['yearly', 'monthly', 'hourly'] }) period: 'yearly' | 'monthly' | 'hourly';
}
const SalaryExpectationSubSchema = SchemaFactory.createForClass(SalaryExpectationSchemaClass);

// --- Main CandidateProfile Schema ---
@Schema({
  timestamps: true, // Automatically manage createdAt and updatedAt
  collection: 'candidate_profiles',
})
export class CandidateProfile extends Document implements ICandidateProfile {
  @Prop({ required: true, trim: true, index: true })
  candidateName: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true, index: true })
  candidateEmail: string; // Primary identifier for finding existing profiles

  @Prop({ unique: true, trim: true, sparse: true, index: true }) // Made optional and sparse unique
  candidatePhone?: string; // Secondary identifier for finding existing profiles

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId; // Link to an existing user if they have an account

  @Prop() dateOfBirth?: Date;
  @Prop() profilePicture?: string;
  @Prop({ enum: Gender }) gender?: Gender;
  @Prop({ enum: MaritalStatus }) maritalStatus?: MaritalStatus;
  @Prop() location?: string;
  @Prop() nationality?: string;

  @Prop({ type: ContactSubSchema }) emergencyContact?: IContact;
  @Prop({ type: [DependentMemberSubSchema] }) dependentMembers?: IDependentMember[];
  @Prop({ type: [EducationEntrySubSchema] }) education?: IEducationEntry[];
  @Prop({ type: [ExperienceEntrySubSchema] }) experiences?: IExperienceEntry[];
  @Prop({ type: [CertificationSubSchema] }) certifications?: ICertification[];
  @Prop({ type: [DocumentSubSchema] }) documents?: IDocument[];

  @Prop([String]) generalSkills?: string[]; // Broader skills list
  @Prop() resumeUrl?: string; // Default resume URL for the profile
  @Prop() linkedInProfile?: string;
  @Prop() portfolioUrl?: string;
  @Prop() githubProfile?: string;

  @Prop() notes?: string; // Internal notes
  @Prop() source?: string; // How this candidate was found
  @Prop() overallExperienceYears?: number;

  @Prop({ type: SalaryExpectationSubSchema })
  salaryExpectation?: { amount: number; currency: string; period: 'yearly' | 'monthly' | 'hourly' };

  @Prop({ default: false }) isAvailableForRemote?: boolean;
  @Prop([String]) preferredJobTitles?: string[];
  @Prop([String]) preferredLocations?: string[];

  // Audit fields
  @Prop({ type: Types.ObjectId, ref: 'User' }) createdBy?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) updatedBy?: Types.ObjectId;
  @Prop({ type: Boolean, default: false, index: true }) isDeleted?: boolean;
  @Prop({ type: Date }) deletedAt?: Date;
  @Prop({ type: Types.ObjectId, ref: 'User' }) deletedBy?: Types.ObjectId;
}

export const CandidateProfileSchema = SchemaFactory.createForClass(CandidateProfile);

// --- Indexes and Hooks ---
CandidateProfileSchema.index({ candidateEmail: 1 }, { unique: true, sparse: true, name: 'unique_candidate_email' });
CandidateProfileSchema.index({ candidatePhone: 1 }, { unique: true, sparse: true, name: 'unique_candidate_phone' });
CandidateProfileSchema.index({ candidateName: 'text', generalSkills: 'text', location: 'text' }); // Text search index

// Soft delete pre-query hooks
CandidateProfileSchema.pre<Query<any, ICandidateProfileDocument>>('find', function () {
  if (!(this as any).__bypassSoftDelete) {
    this.where({ isDeleted: false });
  }
});
CandidateProfileSchema.pre<Query<any, ICandidateProfileDocument>>('findOne', function () {
  if (!(this as any).__bypassSoftDelete) {
    this.where({ isDeleted: false });
  }
});
CandidateProfileSchema.statics.withDeleted = function () {
  const query = this.find();
  (query as any).__bypassSoftDelete = true;
  return query;
};