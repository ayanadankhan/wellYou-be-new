import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionSurveyDto } from './create-question-survey.dto';

export class UpdateQuestionSurveyDto extends PartialType(CreateQuestionSurveyDto) {}
