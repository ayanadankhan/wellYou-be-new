import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateQuestionSurveyDto } from './dto/create-question-survey.dto';
import { UpdateQuestionSurveyDto } from './dto/update-question-survey.dto';
import { QuestionSurvey } from './entities/question-survey.entity';

@Injectable()
export class QuestionSurveyService {
  constructor(
    @InjectModel(QuestionSurvey.name)
    private readonly questionSurveyModel: Model<QuestionSurvey>,
  ) {}

async create(createQuestionSurveyDto: CreateQuestionSurveyDto): Promise<QuestionSurvey> {
  // Convert string surveyId to ObjectId
  const questionToCreate = {
    ...createQuestionSurveyDto,
    surveyId: new Types.ObjectId(createQuestionSurveyDto.surveyId),
  };

  const createdQuestion = new this.questionSurveyModel(questionToCreate);
  return createdQuestion.save();
}
  async findAll(): Promise<QuestionSurvey[]> {
    return this.questionSurveyModel.find().exec();
  }

  async findOne(id: string): Promise<QuestionSurvey> {
    const question = await this.questionSurveyModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  async update(
    id: string,
    updateQuestionSurveyDto: UpdateQuestionSurveyDto,
  ): Promise<QuestionSurvey> {
    const updatedQuestion = await this.questionSurveyModel
      .findByIdAndUpdate(id, updateQuestionSurveyDto, { new: true })
      .exec();
    
    if (!updatedQuestion) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return updatedQuestion;
  }

  async remove(id: string): Promise<QuestionSurvey> {
    const deletedQuestion = await this.questionSurveyModel.findByIdAndDelete(id).exec();
    if (!deletedQuestion) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return deletedQuestion;
  }

  async findBySurveyId(surveyId: string): Promise<QuestionSurvey[]> {
    return this.questionSurveyModel.find({ surveyId }).sort({ order: 1 }).exec();
  }
}