
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type EmployeeDocument = Employee & Document;

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

  // @Prop({ type: Boolean, default: false })
  // isCurrent: boolean;
}

@Schema({
  timestamps: true,
  collection: 'employees',
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
  startDate: Date;

  @Prop({ type: String })
  phoneNumber?: string;

  @Prop({ type: String })
  location?: string;

  @Prop({ type: [Skill] })
  skills: Skill[];

  @Prop({ required: true, type: Number })
  salary: number;

  @Prop({ required: true, type: Number })
  performance: number;

  @Prop({ type: String })
  bio?: string;

  @Prop({ type: [Education] })
  education: Education[];

  @Prop({ type: [Certification] })
  certifications: Certification[];

  @Prop({ type: [Experience] })
  experiences: Experience[];
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
