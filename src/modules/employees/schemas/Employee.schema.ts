import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from "mongoose";
import { Gender, MaritalStatus, EmploymentStatus, EmploymentType, SkillLevel } from '../dto/create-Employee.dto';

export type EmployeeDocument = Employee & Document;

@Schema({ _id: false })
class Document {
  @Prop({ required: false, type: String })
  type: string;

  @Prop({ required: false, type: String })
  name: string;

  @Prop({ required: false, type: String })
  url: string;

}

@Schema({ _id: false })
class Skill {
  @Prop({ required: false, type: String })
  name: string;

  @Prop({ required: false, type: String, enum: SkillLevel })
  level: SkillLevel;
}

@Schema({ _id: false })
class Education {
  @Prop({ required: false, type: String })
  id: string;

  @Prop({ required: false, type: String })
  institution: string;

  @Prop({ required: false, type: String })
  degree: string;

  @Prop({ required: false, type: String })
  fieldOfStudy: string;

  @Prop({ required: false, type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: Number, min: 0, max: 4 })
  gpa?: number;

  @Prop({ type: String })
  honors?: string;

  @Prop({ required: false, type: Boolean })
  isEnrolled: boolean;

  @Prop({ type: String })
  description?: string;
}

@Schema({ _id: false })
class Certification {
  @Prop({ required: false, type: String })
  id: string;

  @Prop({ required: false, type: String })
  name: string;

  @Prop({ required: false, type: String })
  issuingOrganization: string;

  @Prop({ required: false, type: Date })
  issueDate: Date;

  @Prop({ type: Date })
  expirationDate?: Date;

  @Prop({ type: String })
  credentialId?: string;

  @Prop({ type: String })
  verificationUrl?: string;

  @Prop({ type: Boolean })
  hasNoExpiration?: boolean;

  @Prop({ type: String })
  description?: string;
}

@Schema({ _id: false })
class Experience {
  @Prop({ required: false, type: String })
  id: string;

  @Prop({ required: false, type: String })
  companyName: string;

  @Prop({ required: false, type: String })
  position: string;

  @Prop({ required: false, type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ required: false, type: Boolean })
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

@Schema({ _id: false })
class EmergencyContact {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  relationship: string;

  @Prop({ required: true, type: String })
  phone: string;
}

@Schema({ _id: false })
class DependentMember {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  relation: string;

  @Prop({ type: Date })
  dateOfBirth: Date;
}

@Schema({
  timestamps: true,
  collection: 'employees',
})
export class Employee {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  userId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: Date })
  dateOfBirth: Date;

  @Prop({ type: String })
  profilePicture?: string;

  @Prop({ type: String })
  coverPicture?: string;

  @Prop({ required: true, type: String, enum: Gender })
  gender: Gender;

  @Prop({ type: String, enum: EmploymentType })
  employmentType?: EmploymentType;

  @Prop({ required: true, type: String, enum: MaritalStatus })
  maritalStatus: MaritalStatus;

  @Prop({ required: true, type: String })
  phoneNumber: string;

  @Prop({ type: Object, required: true })
  progress: Record<string, any>;

  @Prop({ required: true, type: String })
  location: string;

  @Prop({ required: true, type: String })
  nationality: string;

  @Prop({ required: true, type: EmergencyContact })
  emergencyContact: EmergencyContact;

  @Prop({ type: [DependentMember] })
  dependentMembers?: DependentMember[];

  @Prop({ type: [Education] })
  education?: Education[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'designations', default: null })
  positionId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'departments', default: null })
  departmentId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  reportingTo?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String, enum: EmploymentStatus })
  employmentStatus: EmploymentStatus;

  @Prop({ required: false, type: Date })
  hireDate: Date;

  @Prop({ type: [Experience] })
  experiences?: Experience[];

  @Prop({ type: [Certification] })
  certifications?: Certification[];

  @Prop({ type: [Skill] })
  skills?: Skill[];

  @Prop({ type: [Document] })
  documents?: Document[];

  @Prop({ required: false, type: String })
  ssnTaxId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'companies', default: null })
  tenantId?: MongooseSchema.Types.ObjectId;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);