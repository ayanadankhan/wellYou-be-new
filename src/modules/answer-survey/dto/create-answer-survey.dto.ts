import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAnswerSurveyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  surveyId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  questionId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  answer: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string; // Used for token generation but won't be stored
}