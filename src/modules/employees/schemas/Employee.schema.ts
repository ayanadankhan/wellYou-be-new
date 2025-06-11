import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Document, Types } from "mongoose";
import { Gender, MaritalStatus, EmploymentStatus, EmploymentType, SkillLevel } from '../dto/create-Employee.dto';

export type EmployeeDocument = Employee & Document;

@Schema()
class Skill {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String, enum: SkillLevel })
  level: SkillLevel;

  @Prop({ required: true, type: String })
  category: string;

  @Prop({ required: true, type: Number, min: 0, max: 50 })
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

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: Number, min: 0, max: 4 })
  gpa?: number;

  @Prop({ type: String })
  honors?: string;

  @Prop({ required: true, type: Boolean })
  isEnrolled: boolean;
}

@Schema()
class Certification {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  issuingOrganization: string;

  @Prop({ required: true, type: Date })
  issueDate: Date;

  @Prop({ type: Date })
  expirationDate?: Date;

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

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ required: true, type: Boolean })
  isCurrentRole: boolean;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String })
  location?: string;

  @Prop({ type: String, enum: EmploymentType })
  employmentType?: EmploymentType;

  @Prop({ type: [String] })
  achievements?: string[];
}

@Schema()
class EmergencyContact {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  relationship: string;

  @Prop({ required: true, type: String })
  phone: string;

  @Prop({ type: String })
  secondaryPhone?: string;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  address?: string;
}

@Schema({
  timestamps: true,
  collection: 'employees',
})

export class Employee {
  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "Users" })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "Tenant Id" })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String })
  phoneNumber: string;

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

  @Prop({ type: Date })
  terminationDate?: Date;

  @Prop({ required: true, type: String, enum: EmploymentStatus })
  employmentStatus: EmploymentStatus;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "Department Id" })
  departmentId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "Position Id" })
  positionId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "Manager Id" })
  managerId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "Location Id" })
  locationId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  profilePicture?: string;

  @Prop({ required: true, type: EmergencyContact })
  emergencyContact: EmergencyContact;

  @Prop({ required: true, type: Boolean })
  isActive: boolean;

  @Prop({ type: [Skill] })
  skills?: Skill[];

  @Prop({ type: [Education] })
  education?: Education[];

  @Prop({ type: [Certification] })
  certifications?: Certification[];

  @Prop({ type: [Experience] })
  experiences?: Experience[];
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);