import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Survey } from './entities/survey.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';

@Injectable()
export class SurveyService {
  constructor(
    @InjectModel(Survey.name) private readonly surveyModel: Model<Survey>,
  ) {}

  async create(createSurveyDto: CreateSurveyDto): Promise<Survey> {
    const createdSurvey = new this.surveyModel(createSurveyDto);
    return createdSurvey.save();
  }

  async findAll(params?: {
    title?: string;
    departmentId?: string;
  }): Promise<Survey[]> {
    const query = this.surveyModel.find();

    if (params?.title) {
      query.where('title', new RegExp(params.title, 'i'));
    }

    if (params?.departmentId) {
      query.where('departmentId', params.departmentId);
    }

    return query.exec();
  }

  async findOne(id: string): Promise<Survey | null> {
    return this.surveyModel.findById(id).exec();
  }

  async update(
    id: string,
    updateSurveyDto: UpdateSurveyDto,
  ): Promise<Survey | null> {
    return this.surveyModel
      .findByIdAndUpdate(id, updateSurveyDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Survey | null> {
    return this.surveyModel.findByIdAndDelete(id).exec();
  }
}