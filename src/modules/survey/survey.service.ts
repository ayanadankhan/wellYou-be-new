import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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


private getOverallRatingPipeline(surveyId: string): any[] {
  return [
    {
      $match: { _id: new Types.ObjectId(surveyId) },
    },
    {
      $lookup: {
        from: 'answersurveys',
        let: { surveyId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  { $toObjectId: '$surveyId' },
                  '$$surveyId',
                ],
              },
            },
          },
        ],
        as: 'surveyAnswers',
      },
    },
    { $unwind: '$surveyAnswers' },
    {
      $project: {
        ratingValue: {
          $switch: {
            branches: [
              { case: { $eq: ['$surveyAnswers.answer', 'Strongly Agree'] }, then: 5 },
              { case: { $eq: ['$surveyAnswers.answer', 'Agree'] }, then: 4 },
              { case: { $eq: ['$surveyAnswers.answer', 'Neutral'] }, then: 3 },
              { case: { $eq: ['$surveyAnswers.answer', 'Disagree'] }, then: 2 },
              { case: { $eq: ['$surveyAnswers.answer', 'Strongly Disagree'] }, then: 1 },
            ],
            default: 0,
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        overallRating: { $avg: '$ratingValue' },
      },
    },
  ];
}


private getQuestionWiseRatingPipeline(surveyId: string): any[] {
  return [
    {
      $match: { _id: new Types.ObjectId(surveyId) },
    },
    {
      $lookup: {
        from: 'questionsurveys',
        let: { surveyId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  { $toObjectId: '$surveyId' },
                  '$$surveyId',
                ],
              },
            },
          },
        ],
        as: 'questions',
      },
    },
    { $unwind: '$questions' },
    {
      $lookup: {
        from: 'answersurveys',
        let: { questionId: '$questions._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  { $toObjectId: '$questionId' },
                  '$$questionId',
                ],
              },
            },
          },
        ],
        as: 'questionAnswers',
      },
    },
    { $unwind: '$questionAnswers' },
    {
      $group: {
        _id: '$questions._id',
        questionText: { $first: '$questions.questionText' },
        averageRating: {
          $avg: {
            $switch: {
              branches: [
                { case: { $eq: ['$questionAnswers.answer', 'Strongly Agree'] }, then: 5 },
                { case: { $eq: ['$questionAnswers.answer', 'Agree'] }, then: 4 },
                { case: { $eq: ['$questionAnswers.answer', 'Neutral'] }, then: 3 },
                { case: { $eq: ['$questionAnswers.answer', 'Disagree'] }, then: 2 },
                { case: { $eq: ['$questionAnswers.answer', 'Strongly Disagree'] }, then: 1 }, 
              ],
              default: 0,
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        questionId: '$_id',
        questionText: 1,
        averageRating: { $round: ['$averageRating', 2] },
      },
    },
    { $sort: { questionText: 1 } },
  ];
}


  async getSurveyAnalytics(surveyId: string): Promise<any> {
    const survey = await this.surveyModel.findById(surveyId);
    if (!survey) {
      throw new NotFoundException(`Survey with ID "${surveyId}" not found`);
    }

    const [overallResult, questionResult] = await Promise.all([
      this.surveyModel.aggregate(this.getOverallRatingPipeline(surveyId)).exec(),
      this.surveyModel.aggregate(this.getQuestionWiseRatingPipeline(surveyId)).exec(),
    ]);

    const overallRating =
      overallResult.length > 0 ? overallResult[0].overallRating : 0;

    return {
      surveyTitle: survey.title,
      overallRating,
      questionRatings: questionResult,
    };
  }
}