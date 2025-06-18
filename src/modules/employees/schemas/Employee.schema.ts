import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type EmployeeDocument = Employee & Document;

// Define enums
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  SEPARATED = 'separated',
  OTHER = 'other',
}

export enum EmploymentStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
  RETIRED = 'retired',
  PROBATION = 'probation',
}

@Schema()
class Skill {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  level: string;

  @Prop({ required: true, type: String })
  category: string;

  @Prop({ required: true, type: Number })
  yearsOfExperience: number;
}

@Schema()
class Education {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  institution: string;

  @Prop({ required: true, type: String })
  degree: string;

  @Prop({ required: true, type: String })
  fieldOfStudy: string;

  @Prop({ required: true, type: String })
  startDate: string;

  @Prop({ type: String })
  endDate?: string;

  @Prop({ type: Number })
  gpa?: number;

  @Prop({ type: String })
  honors?: string;

  @Prop({ type: Boolean, default: false })
  isEnrolled: boolean;
}

export const EducationSchema = SchemaFactory.createForClass(Education);

@Schema()
class Certification {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  issuingOrganization: string;

  @Prop({ required: true, type: String })
  issueDate: string;

  @Prop({ type: String })
  expirationDate?: string;

  @Prop({ type: String })
  credentialId?: string;

  @Prop({ type: String })
  verificationUrl?: string;
}

@Schema()
class Experience {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  companyName: string;

  @Prop({ required: true, type: String })
  position: string;

  @Prop({ required: true, type: String })
  startDate: string;

  @Prop({ type: String })
  endDate?: string;

  @Prop({ type: Boolean, default: false })
  isCurrentRole: boolean;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String })
  location?: string;

  @Prop({ type: String })
  employmentType?: string;

  @Prop({ type: [String] })
  achievements?: string[];

  @Prop({ type: String })
  company?: string;
}

@Schema({
  timestamps: true,
})
export class Employee {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String, unique: true })
  email: string;

  @Prop({ required: true, type: String })
  role: string;

  @Prop({ required: true, type: String })
  department: string;

  @Prop({ required: true, type: String })
  position: string;

  @Prop({ required: true, type: String })
  employmentType: string;

  @Prop({ required: true, type: String })
  status: string;

  @Prop({ required: true, type: Date })
  dateOfBirth: Date;

  @Prop({ required: true, type: String, enum: Gender })
  gender: Gender;

  @Prop({ required: true, type: String, enum: MaritalStatus })
  maritalStatus: MaritalStatus;

  @Prop({ required: true, type: [String] })
  nationality: string[];

  @Prop({ required: false, ref: "SSN Tax Id" })
  ssnTaxId: string;

  @Prop({ required: true, type: Date })
  hireDate: Date;

  @Prop({ required: false, type: Date })
  terminationDate?: Date;

  @Prop({ required: true, type: String, enum: EmploymentStatus })
  employmentStatus: EmploymentStatus;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "departments" })
  departmentId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "Position Id" })
  positionId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "Manager Id" })
  managerId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, type: String, ref: "Location" })
  location: string;

  @Prop({ type: String })
  phoneNumber?: string;

  @Prop({ type: [Skill] })
  skills: Skill[];

  @Prop({ required: true, type: Number })
  salary: number;

  @Prop({ required: true, type: Number })
  performance: number;

  @Prop({ type: String })
  bio?: string;

  @Prop({ type: [EducationSchema] })
  education?: Education[];

  @Prop({ type: [Certification] })
  certifications: Certification[];

  @Prop({ type: [Experience] })
  experiences: Experience[];
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);