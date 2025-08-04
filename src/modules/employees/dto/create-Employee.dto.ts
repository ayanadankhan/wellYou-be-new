import { 
  IsString, 
  IsNotEmpty, 
  IsEmail, 
  IsDateString, 
  IsOptional, 
  IsNumber, 
  IsArray, 
  IsBoolean, 
  ValidateNested,
  IsEnum, 
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import { UserRole } from '../../tenant/users/schemas/user.schema';

// Enums for consistent values
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  SEPARATED = 'SEPARATED'
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED',
  RETIRED = 'RETIRED'
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  INTERN = 'INTERN',
  REMOTE = 'REMOTE'
}

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

class SkillDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsEnum(SkillLevel)
  @IsOptional()
  level: SkillLevel;
}

class EducationDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  institution: string;

  @IsString()
  @IsOptional()
  degree: string;

  @IsString()
  @IsOptional()
  fieldOfStudy: string;

  @IsDateString()
  @IsOptional()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  gpa?: number;

  @IsString()
  @IsOptional()
  honors?: string;

  @IsBoolean()
  isEnrolled: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

class CertificationDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  issuingOrganization: string;

  @IsOptional()
  issueDate: string;

  @IsOptional()
  expirationDate?: string;

  @IsString()
  @IsOptional()
  credentialId?: string;

  @IsString()
  @IsOptional()
  verificationUrl?: string;

  @IsBoolean()
  @IsOptional()
  hasNoExpiration?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

class ExperienceDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  companyName: string;

  @IsString()
  @IsOptional()
  position: string;

  @IsDateString()
  @IsOptional()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isCurrentRole: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  achievements?: string[];
}

class EmergencyContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  relationship: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

class DocumentDto {
  @IsString()
  @IsOptional()
  type: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  url: string;
}

export class DependentMemberDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  relation: string;

  @IsOptional()
  dateOfBirth: string;
}

export class CreateEmployeeDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each permission must be a string' })
  permissions?: string[];

  @IsString()
  userId: Types.ObjectId;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  coverPicture?: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsEnum(MaritalStatus)
  @IsNotEmpty()
  maritalStatus: MaritalStatus;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsNotEmpty()
  @IsObject()
  progress: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  nationality: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  @IsOptional()
  documents?: DocumentDto[];

  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsNotEmpty()
  emergencyContact: EmergencyContactDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DependentMemberDto)
  @IsOptional()
  dependentMembers?: DependentMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @IsOptional()
  education?: EducationDto[];

  @IsString()
  @IsNotEmpty()
  positionId: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  departmentId: Types.ObjectId;

  @IsString()
  @IsOptional()
  reportingTo?: Types.ObjectId;

  @IsEnum(EmploymentStatus)
  @IsNotEmpty()
  employmentStatus: EmploymentStatus;

  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @IsOptional()
  experiences?: ExperienceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  @IsOptional()
  certifications?: CertificationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  @IsOptional()
  skills?: SkillDto[];

  @IsString()
  @IsNotEmpty()
  ssnTaxId: string;

  @IsOptional()
  tenantId: Types.ObjectId;
}

export class UpdateEmployeeDto {
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  coverPicture?: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsEnum(MaritalStatus)
  @IsOptional()
  maritalStatus?: MaritalStatus;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsNotEmpty()
  progress: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  @IsOptional()
  documents?: DocumentDto[];

  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergencyContact?: EmergencyContactDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DependentMemberDto)
  @IsOptional()
  dependentMembers?: DependentMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @IsOptional()
  education?: EducationDto[];

  @IsString()
  @IsOptional()
  positionId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  reportingTo?: string;

  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus;

  @IsDateString()
  @IsOptional()
  hireDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @IsOptional()
  experiences?: ExperienceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  @IsOptional()
  certifications?: CertificationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  @IsOptional()
  skills?: SkillDto[];

  @IsString()
  @IsOptional()
  ssnTaxId?: string;

  @IsOptional()
  tenantId?: Types.ObjectId;
}