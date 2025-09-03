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

@Controller('question-surveys') // Note: changed to plural to match frontend API calls
export class QuestionSurveyController {
  constructor(private readonly questionSurveyService: QuestionSurveyService) {}

  @Post()
  create(@Body() createQuestionSurveyDto: CreateQuestionSurveyDto) {
    return this.questionSurveyService.create(createQuestionSurveyDto);
  }

  // Bulk create endpoint
  @Post('bulk')
  createMany(@Body() questions: CreateQuestionSurveyDto[]) {
    return this.questionSurveyService.createMany(questions);
  }

  @Get()
  findAll(@Query('surveyId') surveyId?: string) {
    if (surveyId) {
      return this.questionSurveyService.findBySurveyId(surveyId);
    }
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

  // Delete all questions for a survey
  @Delete('survey/:surveyId')
  removeBySurveyId(@Param('surveyId') surveyId: string) {
    return this.questionSurveyService.removeBySurveyId(surveyId);
  }

  // Bulk delete
  @Delete('bulk')
  removeMany(@Body() data: { ids: string[] }) {
    return this.questionSurveyService.removeMany(data.ids);
  }

  // Reorder questions
  @Patch('survey/:surveyId/reorder')
  reorder(
    @Param('surveyId') surveyId: string,
    @Body() data: { questionIds: string[] }
  ) {
    return this.questionSurveyService.reorder(surveyId, data.questionIds);
  }
}