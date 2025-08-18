import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAnswerSurveyDto } from './dto/create-answer-survey.dto';
import { UpdateAnswerSurveyDto } from './dto/update-answer-survey.dto';
import { AnswerSurvey } from './entities/answer-survey.entity';

@Injectable()
export class AnswerSurveyService {
  constructor(
    @InjectModel(AnswerSurvey.name)
    private readonly answerSurveyModel: Model<AnswerSurvey>,
  ) {}

  async create(createAnswerSurveyDto: CreateAnswerSurveyDto) {
    return await this.answerSurveyModel.create(createAnswerSurveyDto);
  }

  async findAll() {
    return await this.answerSurveyModel.find().exec();
  }

  async findOne(id: string) {
    return await this.answerSurveyModel.findById(id).exec();
  }

  async findByToken(token: string) {
    return await this.answerSurveyModel.findOne({ token }).exec();
  }

  async findBySurveyId(surveyId: string) {
    return await this.answerSurveyModel.find({ surveyId }).exec();
  }

  async update(id: string, updateAnswerSurveyDto: UpdateAnswerSurveyDto) {
    return await this.answerSurveyModel
      .findByIdAndUpdate(id, updateAnswerSurveyDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return await this.answerSurveyModel.findByIdAndDelete(id).exec();
  }
}