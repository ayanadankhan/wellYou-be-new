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
  ArrayNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, MaritalStatus, EmploymentStatus } from '../schemas/Employee.schema';

class SkillDto {
  @ApiProperty({ description: 'Name of the skill', example: 'React' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Proficiency level of the skill', example: 'expert' })
  @IsString()
  @IsNotEmpty()
  level: string;

  @ApiProperty({ description: 'Category of the skill', example: 'Frontend' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Years of experience with the skill', example: 5 })
  @IsNumber()
  @IsNotEmpty()
  yearsOfExperience: number;
}

class EducationDto {
  @ApiProperty({ description: 'Unique ID for the education record', example: 'edu-1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Name of the institution', example: 'Stanford University' })
  @IsString()
  @IsNotEmpty()
  institution: string;

  @ApiProperty({ description: 'Degree obtained', example: 'Master of Science' })
  @IsString()
  @IsNotEmpty()
  degree: string;

  @ApiProperty({ description: 'Field of study', example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  fieldOfStudy: string;

  @ApiProperty({ description: 'Start date of education', example: '2018-09-01' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date of education', example: '2020-06-15', required: false })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'GPA achieved', example: 3.8, required: false })
  @IsNumber()
  @IsOptional()
  gpa?: number;

  @ApiProperty({ description: 'Honors received', example: 'Magna Cum Laude', required: false })
  @IsString()
  @IsOptional()
  honors?: string;

  @ApiProperty({ description: 'Whether this is the current role', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isEnrolled: boolean;
}

class CertificationDto {
  @ApiProperty({ description: 'Unique ID for the certification', example: 'cert-1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Name of the certification', example: 'AWS Solutions Architect Associate' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Issuing organization', example: 'Amazon Web Services' })
  @IsString()
  @IsNotEmpty()
  issuingOrganization: string;

  @ApiProperty({ description: 'Issue date of the certification', example: '2023-04-10' })
  @IsString()
  @IsNotEmpty()
  issueDate: string;

  @ApiProperty({ description: 'Expiration date of the certification', example: '2026-04-10', required: false })
  @IsString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({ description: 'Credential ID', example: 'AWS-ASA-12345', required: false })
  @IsString()
  @IsOptional()
  credentialId?: string;

  @ApiProperty({ description: 'Verification URL', example: 'https://aws.amazon.com/verification/12345', required: false })
  @IsString()
  @IsOptional()
  verificationUrl?: string;
}

class ExperienceDto {
  @ApiProperty({ description: 'Unique ID for the experience', example: 'exp-1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Name of the company', example: 'TechCorp Solutions' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ description: 'Position held', example: 'Senior Software Engineer' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({ description: 'Start date of employment', example: '2021-01-01T00:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date of employment', example: '2022-03-15T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Whether this is the current role', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isCurrentRole: boolean;

  @ApiProperty({ description: 'Description of the role', example: 'Lead development of microservices architecture', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Location of the role', example: 'San Francisco, CA', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Type of employment', example: 'full-time', required: false })
  @IsString()
  @IsOptional()
  employmentType?: string;

  @ApiProperty({ description: 'List of achievements', example: ['Reduced system latency by 40%'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  achievements?: string[];

  @ApiProperty({ description: 'Company name (alias)', example: 'TechCorp Solutions', required: false })
  @IsString()
  @IsOptional()
  company?: string;
}

class EmergencyContactDto {
  @ApiProperty({ description: 'Full name of emergency contact', example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Relationship to employee', example: 'Spouse' })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({ description: 'Phone number of emergency contact', example: '+1-555-987-6543' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Email of emergency contact', example: 'jane.doe@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class CreateEmployeeDto {
  @ApiProperty({ description: 'Name of the employee', example: 'Sarah Johnson' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email of the employee', example: 'sarah.johnson@companyName.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Role of the employee', example: 'senior' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ description: 'Department of the employee', example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ description: 'Position of the employee', example: 'Senior Software Engineer' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({ description: 'Type of employment', example: 'full-time' })
  @IsString()
  @IsNotEmpty()
  employmentType: string;

  @ApiProperty({ description: 'Status of the employee', example: 'active' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ description: 'Date of birth', example: '1990-01-01' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ 
    description: 'Gender of employee', 
    example: Gender.MALE,
    enum: Gender
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({ 
    description: 'Marital status of employee', 
    example: MaritalStatus.SINGLE,
    enum: MaritalStatus
  })
  @IsEnum(MaritalStatus)
  @IsNotEmpty()
  maritalStatus: MaritalStatus;

  @ApiProperty({ 
    description: 'List of nationalities', 
    example: ['USA', 'CAN'], 
    type: [String] 
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  nationality: string[];

  @ApiProperty({ description: 'SSN/Tax ID of employee', example: '123-45-6789' })
  @IsString()
  @IsNotEmpty()
  ssnTaxId: string;

  @ApiProperty({ description: 'Hire date', example: '2022-01-01' })
  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  @ApiProperty({ description: 'Termination date', example: null, required: false })
  @IsDateString()
  @IsOptional()
  terminationDate?: string;

  @ApiProperty({ 
    description: 'Employment status', 
    example: EmploymentStatus.ACTIVE,
    enum: EmploymentStatus
  })
  @IsEnum(EmploymentStatus)
  @IsNotEmpty()
  employmentStatus: EmploymentStatus;

  @ApiProperty({ description: 'Department ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ description: 'Position ID', example: '507f1f77bcf86cd799439012' })
  @IsString()
  @IsNotEmpty()
  positionId: string;

  @ApiProperty({ description: 'Manager ID', example: null, required: false })
  @IsString()
  @IsOptional()
  managerId?: string;

  @ApiProperty({ description: 'Location', example: 'New York' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Phone number', example: '+1-555-123-4567', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ description: 'Profile picture URL', example: 'https://example.com/profile.jpg', required: false })
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiProperty({ description: 'Emergency contact', type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsNotEmpty()
  emergencyContact: EmergencyContactDto;

  @ApiProperty({ description: 'Is active', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @ApiProperty({ description: 'Salary', example: 75000 })
  @IsNumber()
  @IsNotEmpty()
  salary: number;

  @ApiProperty({ description: 'Performance rating', example: 4.5 })
  @IsNumber()
  @IsNotEmpty()
  performance: number;

  @ApiProperty({ description: 'Biography', example: 'Experienced developer...', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: 'Skills', type: [SkillDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  @IsOptional()
  skills?: SkillDto[];

  @ApiProperty({ description: 'Education', type: [EducationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @IsOptional()
  education?: EducationDto[];

  @ApiProperty({ description: 'Certifications', type: [CertificationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  @IsOptional()
  certifications?: CertificationDto[];

  @ApiProperty({ description: 'Experiences', type: [ExperienceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @IsOptional()
  experiences?: ExperienceDto[];
}

export class UpdateEmployeeDto {
  @ApiProperty({ description: 'Name of the employee', example: 'Sarah Johnson', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Email of the employee', example: 'sarah.johnson@companyName.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Role of the employee', example: 'senior', required: false })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({ description: 'Department of the employee', example: 'Engineering', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: 'Position of the employee', example: 'Senior Software Engineer', required: false })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ description: 'Type of employment', example: 'full-time', required: false })
  @IsString()
  @IsOptional()
  employmentType?: string;

  @ApiProperty({ description: 'Status of the employee', example: 'active', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Date of birth', example: '1990-01-01', required: false })
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
    description: 'List of nationalities', 
    example: ['USA', 'CAN'], 
    type: [String],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nationality?: string[];

  @ApiProperty({ description: 'SSN/Tax ID of employee', example: '123-45-6789', required: false })
  @IsString()
  @IsOptional()
  ssnTaxId?: string;

  @ApiProperty({ description: 'Hire date', example: '2022-01-01', required: false })
  @IsDateString()
  @IsOptional()
  hireDate?: string;

  @ApiProperty({ description: 'Termination date', example: null, required: false })
  @IsDateString()
  @IsOptional()
  terminationDate?: string;

  @ApiProperty({ 
    description: 'Employment status', 
    example: EmploymentStatus.ACTIVE,
    enum: EmploymentStatus,
    required: false
  })
  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus;

  @ApiProperty({ description: 'Department ID', example: '507f1f77bcf86cd799439011', required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ description: 'Position ID', example: '507f1f77bcf86cd799439012', required: false })
  @IsString()
  @IsOptional()
  positionId?: string;

  @ApiProperty({ description: 'Manager ID', example: null, required: false })
  @IsString()
  @IsOptional()
  managerId?: string;

  @ApiProperty({ description: 'Location', example: 'New York', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Phone number', example: '+1-555-123-4567', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ description: 'Profile picture URL', example: 'https://example.com/profile.jpg', required: false })
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiProperty({ description: 'Emergency contact', type: EmergencyContactDto, required: false })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergencyContact?: EmergencyContactDto;

  @ApiProperty({ description: 'Is active', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Salary', example: 75000, required: false })
  @IsNumber()
  @IsOptional()
  salary?: number;

  @ApiProperty({ description: 'Performance rating', example: 4.5, required: false })
  @IsNumber()
  @IsOptional()
  performance?: number;

  @ApiProperty({ description: 'Biography', example: 'Experienced developer...', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: 'Skills', type: [SkillDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  @IsOptional()
  skills?: SkillDto[];

  @ApiProperty({ description: 'Education', type: [EducationDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @IsOptional()
  education?: EducationDto[];

  @ApiProperty({ description: 'Certifications', type: [CertificationDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  @IsOptional()
  certifications?: CertificationDto[];

  @ApiProperty({ description: 'Experiences', type: [ExperienceDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @IsOptional()
  experiences?: ExperienceDto[];
}