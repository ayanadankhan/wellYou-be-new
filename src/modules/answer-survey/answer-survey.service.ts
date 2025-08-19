import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAnswerSurveyDto } from './dto/create-answer-survey.dto';
import { UpdateAnswerSurveyDto } from './dto/update-answer-survey.dto';
import { AnswerSurvey } from './entities/answer-survey.entity';
import * as crypto from 'crypto';

@Injectable()
export class AnswerSurveyService {
  constructor(
    @InjectModel(AnswerSurvey.name)
    private readonly answerSurveyModel: Model<AnswerSurvey>,
  ) {}

  private generateToken(surveyId: string, questionId: string, userId: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${surveyId}${questionId}${userId}`);
    return hash.digest('hex');
  }

  async create(createAnswerSurveyDto: CreateAnswerSurveyDto) {
    // Generate token for the answer
    const token = this.generateToken(
      createAnswerSurveyDto.surveyId,
      createAnswerSurveyDto.questionId,
      createAnswerSurveyDto.userId
    );

    // Check for existing submission with same token
    const existingSubmission = await this.answerSurveyModel.findOne({ token });

    if (existingSubmission) {
      throw new ConflictException('This answer has already been submitted');
    }

    // Create new submission without userId
    const newSubmission = await this.answerSurveyModel.create({
      surveyId: createAnswerSurveyDto.surveyId,
      questionId: createAnswerSurveyDto.questionId,
      answer: createAnswerSurveyDto.answer,
      token: token
    });

    return newSubmission;
  }

  async findAll() {
    return await this.answerSurveyModel.find().exec();
  }

  async findOne(id: string) {
    const submission = await this.answerSurveyModel.findById(id).exec();
    if (!submission) {
      throw new NotFoundException('Survey submission not found');
    }
    return submission;
  }

  async findByToken(token: string) {
    const submission = await this.answerSurveyModel.findOne({ token }).exec();
    if (!submission) {
      throw new NotFoundException('Survey submission not found');
    }
    return submission;
  }

  async findBySurveyId(surveyId: string) {
    return await this.answerSurveyModel.find({ surveyId }).exec();
  }

  async findUserAnswers(surveyId: string, userId: string) {
    const allAnswers = await this.findBySurveyId(surveyId);
    
    return allAnswers.filter(answer => {
      const expectedToken = this.generateToken(
        surveyId,
        answer.questionId,
        userId
      );
      return answer.token === expectedToken;
    });
  }

 async getSurveyAnswerStats(surveyId: string) {
    const answers = await this.answerSurveyModel.find({ surveyId }).exec();
    
    type StatsAccumulator = {
      [questionId: string]: {
        questionId: string;
        answers: {
          [answer: string]: number;
        };
        total: number;
      };
    };

    const stats = answers.reduce<StatsAccumulator>((acc, curr) => {
      if (!acc[curr.questionId]) {
        acc[curr.questionId] = {
          questionId: curr.questionId,
          answers: {},
          total: 0
        };
      }
      
      const answerCount = acc[curr.questionId].answers[curr.answer] || 0;
      acc[curr.questionId].answers[curr.answer] = answerCount + 1;
      acc[curr.questionId].total += 1;
      
      return acc;
    }, {});

    return Object.values(stats);
  }


  async update(id: string, updateAnswerSurveyDto: UpdateAnswerSurveyDto) {
    const existing = await this.findOne(id);

    if (updateAnswerSurveyDto.answer) {
      return await this.answerSurveyModel
        .findByIdAndUpdate(
          id, 
          { answer: updateAnswerSurveyDto.answer }, 
          { new: true }
        )
        .exec();
    }

    return existing;
  }

  async remove(id: string) {
    const result = await this.answerSurveyModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Survey submission not found');
    }
    return result;
  }
}