import { Module } from '@nestjs/common';
import { AnswerSurveyService } from './answer-survey.service';
import { AnswerSurveyController } from './answer-survey.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AnswerSurvey, AnswerSurveySchema } from './entities/answer-survey.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnswerSurvey.name, schema: AnswerSurveySchema },
    ]),
  ],
  controllers: [AnswerSurveyController],
  providers: [AnswerSurveyService],
  exports: [AnswerSurveyService],
})
export class AnswerSurveyModule {}