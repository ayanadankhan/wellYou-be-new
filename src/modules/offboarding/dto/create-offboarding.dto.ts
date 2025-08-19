import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  IsDate,
  ValidateNested, // Keep if you plan to use nested DTOs in the future
  IsEnum, // Import IsEnum for enum validation
} from 'class-validator';
import { Type } from 'class-transformer';
import { OffboardingStatus } from '../entities/offboarding.schema'; // Import your OffboardingStatus enum

export class CreateOffboardingDto {
  @IsString()
  employeeId: string;

  @IsString()
  employeeName: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  resignationDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastWorkingDay?: Date;

  @IsOptional()
  @IsString()
  noticePeriod?: string;

  @IsOptional()
  @IsString()
  reasonForLeaving?: string;

  @IsOptional()
  @IsString() // Assuming attachments are stored as string IDs or URLs
  attachments?: string;

  @IsOptional()
  @IsString()
  exitInterviewNotes?: string;

  @IsOptional()
  @IsBoolean()
  knowledgeHandoverCompleted?: boolean;

  @IsOptional()
  @IsString()
  knowledgeHandoverDetails?: string;

  @IsOptional()
  @IsBoolean()
  allAssetsReturned?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  returnedAssetsList?: string[];

  @IsOptional()
  @IsString()
  pendingAssets?: string;

  @IsOptional()
  @IsBoolean()
  hrClearance?: boolean;

  @IsOptional()
  @IsBoolean()
  itClearance?: boolean;

  @IsOptional()
  @IsBoolean()
  payrollClearance?: boolean;

  @IsOptional()
  @IsNumber()
  finalSettlementAmount?: number;

  @IsOptional()
  @IsString()
  settlementNotes?: string;

  @IsOptional()
  @IsBoolean()
  nonDisclosureAgreementSigned?: boolean;

  @IsOptional()
  @IsBoolean()
  nonCompeteAgreementSigned?: boolean;

  @IsOptional()
  @IsString()
  feedbackForCompany?: string;

  @IsOptional()
  @IsString()
  futureContactDetails?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  // NEW: Status field for offboarding
  @IsOptional() // Status is optional here because it has a default in the schema
  @IsEnum(OffboardingStatus)
  status?: OffboardingStatus;
}