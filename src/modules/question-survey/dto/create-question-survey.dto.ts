import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';

// Define the question types enum to match your frontend
export enum QuestionType {  
  TEXTAREA = 'textarea',
  LIKERT = 'likert',
}

export class CreateQuestionSurveyDto {
  @IsNotEmpty()
  surveyId: string;

  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsEnum(QuestionType)
  questionType: QuestionType;

  @IsArray()
  options: string[];

  @IsBoolean()
  isRequired: boolean;

  @IsNumber()
  @IsNotEmpty()
  order: number;
}