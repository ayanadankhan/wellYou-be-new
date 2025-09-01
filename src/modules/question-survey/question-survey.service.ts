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
    const questionToCreate = {
      ...createQuestionSurveyDto,
      surveyId: new Types.ObjectId(createQuestionSurveyDto.surveyId),
    };

    const createdQuestion = new this.questionSurveyModel(questionToCreate);
    return createdQuestion.save();
  }

  // THIS IS THE KEY METHOD YOUR FRONTEND NEEDS
  async createMany(questions: CreateQuestionSurveyDto[]): Promise<QuestionSurvey[]> {
    const questionsWithObjectId = questions.map(q => ({
      ...q,
      surveyId: new Types.ObjectId(q.surveyId),
    }));
    
    return this.questionSurveyModel.insertMany(questionsWithObjectId);
  }

  async findAll(): Promise<QuestionSurvey[]> {
    return this.questionSurveyModel.find().sort({ order: 1 }).exec();
  }

  async findOne(id: string): Promise<QuestionSurvey> {
    const question = await this.questionSurveyModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  // FIXED VERSION - properly converts surveyId to ObjectId
  async findBySurveyId(surveyId: string): Promise<QuestionSurvey[]> {
    return this.questionSurveyModel
      .find({ surveyId: new Types.ObjectId(surveyId) })
      .sort({ order: 1 })
      .exec();
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

  async removeBySurveyId(surveyId: string): Promise<void> {
    await this.questionSurveyModel
      .deleteMany({ surveyId: new Types.ObjectId(surveyId) })
      .exec();
  }

  async removeMany(ids: string[]): Promise<void> {
    const objectIds = ids.map(id => new Types.ObjectId(id));
    await this.questionSurveyModel
      .deleteMany({ _id: { $in: objectIds } })
      .exec();
  }

  async reorder(surveyId: string, questionIds: string[]): Promise<QuestionSurvey[]> {
    const bulkOps = questionIds.map((id, index) => ({
      updateOne: {
        filter: { 
          _id: new Types.ObjectId(id), 
          surveyId: new Types.ObjectId(surveyId) 
        },
        update: { order: index + 1 }
      }
    }));

    await this.questionSurveyModel.bulkWrite(bulkOps);
    
    return this.findBySurveyId(surveyId);
  }
}