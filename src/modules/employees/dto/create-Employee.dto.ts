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
  IsEnum, 
  IsMongoId,
  ArrayNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId, Types } from 'mongoose';

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

  @ApiProperty({ 
    description: 'Category of the skill', 
    example: 'Frontend',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ 
    description: 'Years of experience with the skill', 
    example: 5,
    minimum: 0,
    maximum: 50,
    required: true
  })
  @IsNumber()
  @IsNotEmpty()
  yearsOfExperience: number;
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
    example: 'Sister',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  relationship: string; // Fixed typo from relationShip to relationship

  @ApiProperty({ 
    description: 'Primary phone number of emergency contact', 
    example: '+1-555-987-6543',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ 
    description: 'Secondary phone number of emergency contact', 
    example: '+1-555-123-4567', 
    required: false 
  })
  @IsString()
  @IsOptional()
  secondaryPhone?: string;

  @ApiProperty({ 
    description: 'Email of emergency contact', 
    example: 'jane.doe@example.com', 
    required: false 
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    description: 'Physical address of emergency contact', 
    example: '123 Main St, Anytown, USA', 
    required: false 
  })
  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateEmployeeDto {
  @ApiProperty({ 
    description: 'User ID of employee', 
    example: '68493a652f2fcfe8e1112a61',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  userId: Types.ObjectId;

  @ApiProperty({ 
    description: 'Tenant ID of employee', 
    example: '68493a652f2fcfe8e1112a61',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  tenantId: Types.ObjectId;

  @ApiProperty({ 
    description: 'Phone number of employee', 
    example: '+1-555-123-4567',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ 
    description: 'Date of birth of employee (YYYY-MM-DD)', 
    example: '1990-05-15',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ 
    description: 'Gender of employee', 
    example: Gender.MALE,
    enum: Gender,
    required: true
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({ 
    description: 'Marital status of employee', 
    example: MaritalStatus.SINGLE,
    enum: MaritalStatus,
    required: true
  })
  @IsEnum(MaritalStatus)
  @IsNotEmpty()
  maritalStatus: MaritalStatus;

  @ApiProperty({ 
    description: 'List of nationalities (ISO 3166-1 alpha-3 country codes)', 
    example: ['USA', 'PAK', 'GBR'], 
    required: true,
    isArray: true,
    type: String
  })
  @IsArray({ message: 'Nationality must be an array' })
  @ArrayNotEmpty({ message: 'Nationality array must not be empty' })
  @IsString({ each: true, message: 'Each nationality must be a string' })
  @Type(() => String)
  nationality: string[];

  @ApiProperty({ 
    description: 'SSN/Tax ID of employee', 
    example: '123-45-6789',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  ssnTaxId: Types.ObjectId;

  @ApiProperty({ 
    description: 'Hire date of employee (YYYY-MM-DD)', 
    example: '2023-01-10',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  @ApiProperty({ 
    description: 'Termination date of employee (YYYY-MM-DD)', 
    example: null, 
    required: false 
  })
  @IsDateString()
  @IsOptional()
  terminationDate?: string;

  @ApiProperty({ 
    description: 'Employment status of employee', 
    example: EmploymentStatus.ACTIVE,
    enum: EmploymentStatus,
    required: true
  })
  @IsEnum(EmploymentStatus)
  @IsNotEmpty()
  employmentStatus: EmploymentStatus;

  @ApiProperty({ 
    description: 'Department ID of employee', 
    example: '68493a652f2fcfe8e1112a61',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  departmentId: Types.ObjectId;

  @ApiProperty({ 
    description: 'Position ID of employee', 
    example: '323e4567-e89b-12d3-a456-426614174002',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  positionId: Types.ObjectId;

  @ApiProperty({ 
    description: 'Manager ID of employee', 
    example: null, 
    required: false 
  })
  @IsString()
  @IsOptional()
  managerId?: Types.ObjectId;

  @ApiProperty({ 
    description: 'Location ID of employee', 
    example: '423e4567-e89b-12d3-a456-426614174003',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  locationId: Types.ObjectId;

  @ApiProperty({ 
    description: 'Profile picture URL of employee', 
    example: 'https://company.com/profiles/john_doe.jpg', 
    required: false 
  })
  @IsString()
  @IsOptional()
  profilePicture?: string;

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
    description: 'Whether employee is active', 
    example: true,
    required: true
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @ApiProperty({
    description: 'Array of employee skills',
    type: [SkillDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  @IsOptional()
  skills?: SkillDto[];

  @ApiProperty({
    description: 'Array of employee education records',
    type: [EducationDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @IsOptional()
  education?: EducationDto[];

  @ApiProperty({
    description: 'Array of employee certifications',
    type: [CertificationDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  @IsOptional()
  certifications?: CertificationDto[];

  @ApiProperty({
    description: 'Array of employee work experiences',
    type: [ExperienceDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @IsOptional()
  experiences?: ExperienceDto[];
}

export class UpdateEmployeeDto {
  @ApiProperty({ 
    description: 'First name of employee', 
    example: 'John', 
    required: false 
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ 
    description: 'Last name of employee', 
    example: 'Doe', 
    required: false 
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ 
    description: 'Email of employee', 
    example: 'john.doe@company.com', 
    required: false 
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    description: 'Phone number of employee', 
    example: '+1-555-123-4567', 
    required: false 
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ 
    description: 'Date of birth of employee (YYYY-MM-DD)', 
    example: '1990-05-15', 
    required: false 
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ 
    description: 'Gender of employee', 
    example: Gender.MALE,
    enum: Gender,
    required: false 
  })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ 
    description: 'Marital status of employee', 
    example: MaritalStatus.SINGLE,
    enum: MaritalStatus,
    required: false 
  })
  @IsEnum(MaritalStatus)
  @IsOptional()
  maritalStatus?: MaritalStatus;

  @ApiProperty({ 
    description: 'Nationality of employee (ISO 3166-1 alpha-3 country code)', 
    example: 'USA', 
    required: false 
  })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ 
    description: 'SSN/Tax ID of employee', 
    example: '123-45-6789', 
    required: false 
  })
  @IsString()
  @IsOptional()
  ssnTaxId?: string;

  @ApiProperty({ 
    description: 'Hire date of employee (YYYY-MM-DD)', 
    example: '2023-01-10', 
    required: false 
  })
  @IsDateString()
  @IsOptional()
  hireDate?: string;

  @ApiProperty({ 
    description: 'Termination date of employee (YYYY-MM-DD)', 
    example: null, 
    required: false 
  })
  @IsDateString()
  @IsOptional()
  terminationDate?: string;

  @ApiProperty({ 
    description: 'Employment status of employee', 
    example: EmploymentStatus.ACTIVE,
    enum: EmploymentStatus,
    required: false 
  })
  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus;

  @ApiProperty({ 
    description: 'Department ID of employee', 
    example: '68493a652f2fcfe8e1112a61', 
    required: false 
  })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ 
    description: 'Position ID of employee', 
    example: '323e4567-e89b-12d3-a456-426614174002', 
    required: false 
  })
  @IsString()
  @IsOptional()
  positionId?: string;

  @ApiProperty({ 
    description: 'Manager ID of employee', 
    example: null, 
    required: false 
  })
  @IsString()
  @IsOptional()
  managerId?: string;

  @ApiProperty({ 
    description: 'Location ID of employee', 
    example: '423e4567-e89b-12d3-a456-426614174003', 
    required: false 
  })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiProperty({ 
    description: 'Profile picture URL of employee', 
    example: 'https://company.com/profiles/john_doe.jpg', 
    required: false 
  })
  @IsString()
  @IsOptional()
  profilePicture?: string;

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
    description: 'Whether employee is active', 
    example: true, 
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Array of employee skills',
    type: [SkillDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  @IsOptional()
  skills?: SkillDto[];

  @ApiProperty({
    description: 'Array of employee education records',
    type: [EducationDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @IsOptional()
  education?: EducationDto[];

  @ApiProperty({
    description: 'Array of employee certifications',
    type: [CertificationDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  @IsOptional()
  certifications?: CertificationDto[];

  @ApiProperty({
    description: 'Array of employee work experiences',
    type: [ExperienceDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @IsOptional()
  experiences?: ExperienceDto[];
}