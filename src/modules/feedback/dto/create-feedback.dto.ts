import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsObject, IsString, Max, Min, ValidateNested } from 'class-validator';

class RatingsDto {
  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0) @Max(5)
  attendance: number;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0) @Max(5)
  taskCompletion: number;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0) @Max(5)
  situationalLeadership: number;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0) @Max(5)
  professionalAttire: number;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0) @Max(5)
  wellbeing: number;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0) @Max(5)
  communication: number;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0) @Max(5)
  teamwork: number;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0) @Max(5)
  innovation: number;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0) @Max(5)
  adaptability: number;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0) @Max(5)
  goalAchievement: number;
}

class CommentsDto {
  @ApiProperty()
  @IsString()
  attendance: string;

  @ApiProperty()
  @IsString()
  taskCompletion: string;

  @ApiProperty()
  @IsString()
  situationalLeadership: string;

  @ApiProperty()
  @IsString()
  professionalAttire: string;

  @ApiProperty()
  @IsString()
  wellbeing: string;

  @ApiProperty()
  @IsString()
  communication: string;

  @ApiProperty()
  @IsString()
  teamwork: string;

  @ApiProperty()
  @IsString()
  innovation: string;

  @ApiProperty()
  @IsString()
  adaptability: string;

  @ApiProperty()
  @IsString()
  goalAchievement: string;
}

export class CreateFeedbackDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reviewPeriod: string;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => RatingsDto)
  ratings: RatingsDto;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => CommentsDto)
  comments: CommentsDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  overallComment: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  developmentAreas: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  strengths: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  goals: string;
}