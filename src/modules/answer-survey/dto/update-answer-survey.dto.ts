import { PartialType } from '@nestjs/mapped-types';
import { CreateAnswerSurveyDto } from './create-answer-survey.dto';

export class UpdateAnswerSurveyDto extends PartialType(CreateAnswerSurveyDto) {}
