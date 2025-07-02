import { ApiProperty } from '@nestjs/swagger';
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
  IsEnum 
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

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
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  RETIRED = 'RETIRED'
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  INTERN = 'INTERN'
}

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

class SkillDto {
  @ApiProperty({ 
    description: 'Name of the skill', 
    example: 'React',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Proficiency level of the skill', 
    example: SkillLevel.EXPERT,
    enum: SkillLevel,
    required: true
  })
  @IsEnum(SkillLevel)
  @IsNotEmpty()
  level: SkillLevel;
}

class EducationDto {
  @ApiProperty({ 
    description: 'Unique ID for the education record', 
    example: 'edu-1',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ 
    description: 'Name of the institution', 
    example: 'Stanford University',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  institution: string;

  @ApiProperty({ 
    description: 'Degree obtained', 
    example: 'Master of Science',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  degree: string;

  @ApiProperty({ 
    description: 'Field of study', 
    example: 'Computer Science',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  fieldOfStudy: string;

  @ApiProperty({ 
    description: 'Start date of education (YYYY-MM-DD)', 
    example: '2018-09-01',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ 
    description: 'End date of education (YYYY-MM-DD)', 
    example: '2020-06-15', 
    required: false 
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ 
    description: 'GPA achieved', 
    example: 3.8, 
    minimum: 0,
    maximum: 4,
    required: false 
  })
  @IsNumber()
  @IsOptional()
  gpa?: number;

  @ApiProperty({ 
    description: 'Honors received', 
    example: 'Magna Cum Laude', 
    required: false 
  })
  @IsString()
  @IsOptional()
  honors?: string;

  @ApiProperty({ 
    description: 'Whether currently enrolled in this education', 
    example: false,
    required: true
  })
  @IsBoolean()
  @IsNotEmpty()
  isEnrolled: boolean;

  @ApiProperty({ 
    description: 'Description of education', 
    example: 'Description of the education program', 
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;
}

class CertificationDto {
  @ApiProperty({ 
    description: 'Unique ID for the certification', 
    example: 'cert-1',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ 
    description: 'Name of the certification', 
    example: 'AWS Solutions Architect Associate',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Issuing organization', 
    example: 'Amazon Web Services',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  issuingOrganization: string;

  @ApiProperty({ 
    description: 'Issue date of the certification (YYYY-MM-DD)', 
    example: '2023-04-10',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @ApiProperty({ 
    description: 'Expiration date of the certification (YYYY-MM-DD)', 
    example: '2026-04-10', 
    required: false 
  })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({ 
    description: 'Credential ID', 
    example: 'AWS-ASA-12345', 
    required: false 
  })
  @IsString()
  @IsOptional()
  credentialId?: string;

  @ApiProperty({ 
    description: 'Verification URL', 
    example: 'https://aws.amazon.com/verification/12345', 
    required: false 
  })
  @IsString()
  @IsOptional()
  verificationUrl?: string;

  @ApiProperty({ 
    description: 'Whether certification has no expiration', 
    example: true, 
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  hasNoExpiration?: boolean;

  @ApiProperty({ 
    description: 'Description of certification', 
    example: 'Description of certification', 
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;
}

class ExperienceDto {
  @ApiProperty({ 
    description: 'Unique ID for the experience', 
    example: 'exp-1',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ 
    description: 'Name of the company', 
    example: 'TechCorp Solutions',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ 
    description: 'Position held', 
    example: 'Senior Software Engineer',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({ 
    description: 'Start date of employment (ISO 8601 format)', 
    example: '2021-01-01T00:00:00.000Z',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ 
    description: 'End date of employment (ISO 8601 format)', 
    example: '2022-03-15T00:00:00.000Z', 
    required: false 
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ 
    description: 'Whether this is the current role', 
    example: false,
    required: true
  })
  @IsBoolean()
  @IsNotEmpty()
  isCurrentRole: boolean;

  @ApiProperty({ 
    description: 'Description of the role', 
    example: 'Lead development of microservices architecture', 
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Location of the role', 
    example: 'San Francisco, CA', 
    required: false 
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ 
    description: 'Type of employment', 
    example: EmploymentType.FULL_TIME,
    enum: EmploymentType,
    required: false 
  })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiProperty({ 
    description: 'List of achievements', 
    example: ['Reduced system latency by 40%'], 
    required: false 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  achievements?: string[];
}

class EmergencyContactDto {
  @ApiProperty({ 
    description: 'Full name of emergency contact', 
    example: 'Jane Doe',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Relationship with employee', 
    example: 'spouse',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({ 
    description: 'Primary phone number of emergency contact', 
    example: '+1-555-987-6543',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

class DocumentDto {
  @ApiProperty({ 
    description: 'Type of document', 
    example: 'RESUME',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ 
    description: 'Name of the document', 
    example: 'John_Doe_Resume.pdf',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'URL to access the document', 
    example: 'https://example.com/documents/john_doe_resume.pdf',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class DependentMemberDto {
  @ApiProperty({ 
    description: 'Name of the dependent member', 
    example: 'John Doe',
    required: true
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ 
    description: 'Relationship with employee', 
    example: 'Son',
    required: true
  })
  @IsString()
  @IsOptional()
  relation: string;

  @ApiProperty({ 
    description: 'Date of birth of dependent member (YYYY-MM-DD)', 
    example: '2012-05-15',
    required: true
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth: string;
}

export class CreateEmployeeDto {
  @ApiProperty({ 
    description: 'User ID from authentication system', 
    example: '685250901ba0296a0cd34398',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  userId: Types.ObjectId;

  @ApiProperty({ 
    description: 'Date of birth of employee (YYYY-MM-DD)', 
    example: '1990-05-15',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ 
    description: 'Profile picture URL', 
    example: '', 
    required: false 
  })
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiProperty({ 
    description: 'Cover picture URL', 
    example: '', 
    required: false 
  })
  @IsString()
  @IsOptional()
  coverPicture?: string;

  @ApiProperty({ 
    description: 'Gender of employee', 
    example: Gender.FEMALE,
    enum: Gender,
    required: true
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({ 
    description: 'Marital status of employee', 
    example: MaritalStatus.MARRIED,
    enum: MaritalStatus,
    required: true
  })
  @IsEnum(MaritalStatus)
  @IsNotEmpty()
  maritalStatus: MaritalStatus;

  @ApiProperty({ 
    description: 'Phone number of employee', 
    example: '+1 (555) 123-4567',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ 
    description: 'Location of employee', 
    example: 'Punjab, Pakistan',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ 
    description: 'Nationalities of employee', 
    example: ['American', 'Canadian'],
    type: [String],
    required: true
  })
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @ApiProperty({ 
    description: 'Array of employee documents (name, type, url)', 
    type: [DocumentDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  @IsOptional()
  documents?: DocumentDto[];

  @ApiProperty({ 
    description: 'Emergency contact information', 
    type: EmergencyContactDto,
    required: true
  })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsNotEmpty()
  emergencyContact: EmergencyContactDto;

  @ApiProperty({ 
    description: 'Array of dependent members', 
    type: [DependentMemberDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DependentMemberDto)
  @IsOptional()
  dependentMembers?: DependentMemberDto[];

  @ApiProperty({ 
    description: 'Education history', 
    type: [EducationDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @IsOptional()
  education?: EducationDto[];

  @ApiProperty({ 
    description: 'Position ID', 
    example: '68525d312bec266251cd4c7d',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  positionId: Types.ObjectId;

  @ApiProperty({ 
    description: 'Department ID', 
    example: '68525d11901645947fe40724',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  departmentId: Types.ObjectId;

  @ApiProperty({ 
    description: 'Reporting To ID', 
    example: '609e129d8e3a2c1a7890abcd',
    required: false
  })
  @IsString()
  @IsOptional()
  reportingTo?: Types.ObjectId;

  @ApiProperty({ 
    description: 'Employment status of employee', 
    example: EmploymentStatus.RETIRED,
    enum: EmploymentStatus,
    required: true
  })
  @IsEnum(EmploymentStatus)
  @IsNotEmpty()
  employmentStatus: EmploymentStatus;

  @ApiProperty({ 
    description: 'Hire date (YYYY-MM-DD)', 
    example: '2022-04-21',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  @ApiProperty({ 
    description: 'Work experiences', 
    type: [ExperienceDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @IsOptional()
  experiences?: ExperienceDto[];

  @ApiProperty({ 
    description: 'Certifications', 
    type: [CertificationDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  @IsOptional()
  certifications?: CertificationDto[];

  @ApiProperty({ 
    description: 'Skills', 
    type: [SkillDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  @IsOptional()
  skills?: SkillDto[];

  @ApiProperty({ 
    description: 'SSN/Tax ID', 
    example: '684936da00d419b8ac546d00',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  ssnTaxId: string;

  @ApiProperty({ 
    description: 'Tenant ID', 
    example: '684936da00d419b8ac546d00',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  tenantId: Types.ObjectId;
}

export class UpdateEmployeeDto {
  @ApiProperty({ 
    description: 'Date of birth of employee (YYYY-MM-DD)', 
    example: '1990-05-15', 
    required: false 
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ 
    description: 'Profile picture URL', 
    example: '', 
    required: false 
  })
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiProperty({ 
    description: 'COver picture URL', 
    example: '', 
    required: false 
  })
  @IsString()
  @IsOptional()
  coverPicture?: string;

  @ApiProperty({ 
    description: 'Gender of employee', 
    example: Gender.FEMALE,
    enum: Gender,
    required: false 
  })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ 
    description: 'Marital status of employee', 
    example: MaritalStatus.MARRIED,
    enum: MaritalStatus,
    required: false 
  })
  @IsEnum(MaritalStatus)
  @IsOptional()
  maritalStatus?: MaritalStatus;

  @ApiProperty({ 
    description: 'Phone number of employee', 
    example: '+1 (555) 123-4567', 
    required: false 
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ 
    description: 'Location of employee', 
    example: 'Punjab, Pakistan', 
    required: false 
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ 
    description: 'Nationalities of employee', 
    example: ['American', 'Canadian'],
    type: [String],
    required: false 
  })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ 
    description: 'Array of employee documents (name, type, url)', 
    type: [DocumentDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  @IsOptional()
  documents?: DocumentDto[];

  @ApiProperty({ 
    description: 'Emergency contact information', 
    type: EmergencyContactDto, 
    required: false 
  })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergencyContact?: EmergencyContactDto;

  @ApiProperty({ 
    description: 'Array of dependent members', 
    type: [DependentMemberDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DependentMemberDto)
  @IsOptional()
  dependentMembers?: DependentMemberDto[];

  @ApiProperty({ 
    description: 'Education history', 
    type: [EducationDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @IsOptional()
  education?: EducationDto[];

  @ApiProperty({ 
    description: 'Position ID', 
    example: '68525d312bec266251cd4c7d', 
    required: false 
  })
  @IsString()
  @IsOptional()
  positionId?: string;

  @ApiProperty({ 
    description: 'Department ID', 
    example: '68525d11901645947fe40724', 
    required: false 
  })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ 
    description: 'Reporting To ID', 
    example: '609e129d8e3a2c1a7890abcd', 
    required: false 
  })
  @IsString()
  @IsOptional()
  reportingTo?: string;

  @ApiProperty({ 
    description: 'Employment status of employee', 
    example: EmploymentStatus.RETIRED,
    enum: EmploymentStatus,
    required: false 
  })
  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus;

  @ApiProperty({ 
    description: 'Hire date (YYYY-MM-DD)', 
    example: '2022-04-21', 
    required: false 
  })
  @IsDateString()
  @IsOptional()
  hireDate?: string;

  @ApiProperty({ 
    description: 'Work experiences', 
    type: [ExperienceDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @IsOptional()
  experiences?: ExperienceDto[];

  @ApiProperty({ 
    description: 'Certifications', 
    type: [CertificationDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  @IsOptional()
  certifications?: CertificationDto[];

  @ApiProperty({ 
    description: 'Skills', 
    type: [SkillDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  @IsOptional()
  skills?: SkillDto[];

  @ApiProperty({ 
    description: 'SSN/Tax ID', 
    example: '684936da00d419b8ac546d00', 
    required: false 
  })
  @IsString()
  @IsOptional()
  ssnTaxId?: string;


  @ApiProperty({ 
    description: 'Tenant ID', 
    example: '684936da00d419b8ac546d00', 
    required: false 
  })
  @IsString()
  @IsOptional()
  tenantId?: Types.ObjectId;
}