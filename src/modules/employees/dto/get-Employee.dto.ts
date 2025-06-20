import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsDateString, IsNumber, IsArray, IsBoolean, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class SkillDto {
  @ApiProperty({ description: 'Name of the skill', example: 'React' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Proficiency level of the skill', example: 'expert' })
  @IsString()
  level: string;
}

class EducationDto {
  @ApiProperty({ description: 'Unique ID for the education record', example: 'edu-1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Name of the institution', example: 'Stanford University' })
  @IsString()
  institution: string;

  @ApiProperty({ description: 'Degree obtained', example: 'Master of Science' })
  @IsString()
  degree: string;

  @ApiProperty({ description: 'Field of study', example: 'Computer Science' })
  @IsString()
  fieldOfStudy: string;

  @ApiProperty({ description: 'Start date of education', example: '2018-09-01' })
  @IsString()
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
}

class CertificationDto {
  @ApiProperty({ description: 'Unique ID for the certification', example: 'cert-1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Name of the certification', example: 'AWS Solutions Architect Associate' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Issuing organization', example: 'Amazon Web Services' })
  @IsString()
  issuingOrganization: string;

  @ApiProperty({ description: 'Issue date of the certification', example: '2023-04-10' })
  @IsString()
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
  id: string;

  @ApiProperty({ description: 'Name of the company', example: 'TechCorp Solutions' })
  @IsString()
  companyName: string;

  @ApiProperty({ description: 'Position held', example: 'Senior Software Engineer' })
  @IsString()
  position: string;

  @ApiProperty({ description: 'Start date of employment', example: '2021-01-01T00:00:00.000Z' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: 'End date of employment', example: '2022-03-15T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Whether this is the current role', example: true })
  @IsBoolean()
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

  @ApiProperty({ description: 'Whether this is the current employment', example: true })
  @IsBoolean()
  isCurrent: boolean;
}

export class GetEmployeeDto {
  @ApiProperty({ description: 'MongoDB ObjectID of the employee', example: '60c72b2f9b1e8c001c8b4567' })
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Name of the employee', example: 'Sarah Johnson' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email of the employee', example: 'sarah.johnson@companyName.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Role of the employee', example: 'senior' })
  @IsString()
  role: string;

  @ApiProperty({ description: 'Department of the employee', example: 'Engineering' })
  @IsString()
  department: string;

  @ApiProperty({ description: 'Position of the employee', example: 'Senior Software Engineer' })
  @IsString()
  position: string;

  @ApiProperty({ description: 'Type of employment', example: 'full-time' })
  @IsString()
  employmentType: string;

  @ApiProperty({ description: 'Status of the employee', example: 'active' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Start date of employment', example: '2022-03-15T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Phone number of the employee', example: '+1 (555) 123-4567', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ description: 'Location of the employee', example: 'San Francisco, CA', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Skills of the employee', type: [SkillDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills: SkillDto[];

  @ApiProperty({ description: 'Salary of the employee', example: 125000 })
  @IsNumber()
  salary: number;

  @ApiProperty({ description: 'Performance rating of the employee', example: 4 })
  @IsNumber()
  performance: number;

  @ApiProperty({ description: 'Biography of the employee', example: 'Experienced software engineer...', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: 'Education history of the employee', type: [EducationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education: EducationDto[];

  @ApiProperty({ description: 'Certifications of the employee', type: [CertificationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications: CertificationDto[];

  @ApiProperty({ description: 'Work experiences of the employee', type: [ExperienceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences: ExperienceDto[];

  @ApiProperty({ description: 'Creation timestamp', example: '2023-01-01T00:00:00.000Z' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Update timestamp', example: '2023-01-02T00:00:00.000Z' })
  @IsDateString()
  updatedAt: string;
}