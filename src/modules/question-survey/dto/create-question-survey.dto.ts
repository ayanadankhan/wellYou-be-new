import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateQuestionSurveyDto {
  @IsNotEmpty()
  surveyId: string;

  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsArray()
  @IsNotEmpty()
  options: string[];

  @IsBoolean()
  isRequired: boolean;

  @IsNumber()
  @IsNotEmpty()
  order: number;
}