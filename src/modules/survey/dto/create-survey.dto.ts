import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })  // har element string hona chahiye
  @IsNotEmpty()
  departmentIds: string[];
  
  @IsString()
  @IsNotEmpty()
  instruction: string;
}