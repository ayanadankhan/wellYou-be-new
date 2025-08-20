import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { QuestionSurveyService } from './question-survey.service';
import { CreateQuestionSurveyDto } from './dto/create-question-survey.dto';
import { UpdateQuestionSurveyDto } from './dto/update-question-survey.dto';

@Controller('question-survey')
export class QuestionSurveyController {
  constructor(private readonly questionSurveyService: QuestionSurveyService) {}

  @Post()
  create(@Body() createQuestionSurveyDto: CreateQuestionSurveyDto) {
    return this.questionSurveyService.create(createQuestionSurveyDto);
  }

  @Get()
  findAll() {
    return this.questionSurveyService.findAll();
  }

  @Get('survey/:surveyId')
  findBySurveyId(@Param('surveyId') surveyId: string) {
    return this.questionSurveyService.findBySurveyId(surveyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionSurveyService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionSurveyDto: UpdateQuestionSurveyDto,
  ) {
    return this.questionSurveyService.update(id, updateQuestionSurveyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionSurveyService.remove(id);
  }
}