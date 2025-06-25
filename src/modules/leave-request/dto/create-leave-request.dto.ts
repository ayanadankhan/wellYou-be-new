import { 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsDateString, 
  IsArray, 
  ArrayMaxSize,
  MaxLength,
  Validate,
  IsMongoId,
  IsIn,
  Min,
  IsNumber
} from 'class-validator';
// import { IsAfterDate } from '../validators/is-after-date.validator'; // Custom validator for date comparison

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsMongoId()
  employeeId: string;

  @IsNotEmpty()
  leaveType: string;

  @IsNotEmpty()
  @IsDateString()
  // @Validate(IsAfterDate, ['startDate']) // Ensures endDate is after startDate
  startDate: Date;

  @IsNotEmpty()
  @IsDateString()
  endDate: Date;

  @IsOptional()
  @IsBoolean()
  isHalfDay?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5) // Limit to 5 documents
  @IsString({ each: true })
  documents?: string[] = [];



  // You might want to add these for direct creation (admin use)
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'cancelled'])
  status?: string = 'pending';

  @IsOptional()
  @IsNumber()
  @Min(0)
  daysCount?: number; // Will be auto-calculated if not provided
 
  @IsOptional()
  @IsNumber()
  usedDays?: number; 
}