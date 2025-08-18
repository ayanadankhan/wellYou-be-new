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
import { AnswerSurveyService } from './answer-survey.service';
import { CreateAnswerSurveyDto } from './dto/create-answer-survey.dto';
import { UpdateAnswerSurveyDto } from './dto/update-answer-survey.dto';

@Controller('answer-survey')
export class AnswerSurveyController {
  constructor(private readonly answerSurveyService: AnswerSurveyService) {}

  @Post()
  create(@Body() createAnswerSurveyDto: CreateAnswerSurveyDto) {
    return this.answerSurveyService.create(createAnswerSurveyDto);
  }

  @Get()
  findAll() {
    return this.answerSurveyService.findAll();
  }

  @Get('survey/:surveyId')
  findBySurveyId(@Param('surveyId') surveyId: string) {
    return this.answerSurveyService.findBySurveyId(surveyId);
  }

  @Get('token/:token')
  findByToken(@Param('token') token: string) {
    return this.answerSurveyService.findByToken(token);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.answerSurveyService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAnswerSurveyDto: UpdateAnswerSurveyDto,
  ) {
    return this.answerSurveyService.update(id, updateAnswerSurveyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.answerSurveyService.remove(id);
  }
}