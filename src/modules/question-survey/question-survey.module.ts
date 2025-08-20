import { Module } from '@nestjs/common';
import { QuestionSurveyService } from './question-survey.service';
import { QuestionSurveyController } from './question-survey.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionSurvey, QuestionSurveySchema } from './entities/question-survey.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionSurvey.name, schema: QuestionSurveySchema },
    ]),
  ],
  controllers: [QuestionSurveyController],
  providers: [QuestionSurveyService],
  exports: [QuestionSurveyService],
})
export class QuestionSurveyModule {}