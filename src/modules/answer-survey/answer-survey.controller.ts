import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
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

  @Get('stats/:surveyId')
  getSurveyStats(@Param('surveyId') surveyId: string) {
    return this.answerSurveyService.getSurveyAnswerStats(surveyId);
  }



  @Get('user/:userId')
  findUserAnswers(
    @Param('userId') userId: string,
    @Query('surveyId') surveyId: string
  ) {
    if (!surveyId) {
      throw new BadRequestException('surveyId query parameter is required');
    }
    return this.answerSurveyService.findUserAnswers(surveyId, userId);
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