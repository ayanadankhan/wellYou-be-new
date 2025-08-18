import { Test, TestingModule } from '@nestjs/testing';
import { QuestionSurveyController } from './question-survey.controller';
import { QuestionSurveyService } from './question-survey.service';

describe('QuestionSurveyController', () => {
  let controller: QuestionSurveyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionSurveyController],
      providers: [QuestionSurveyService],
    }).compile();

    controller = module.get<QuestionSurveyController>(QuestionSurveyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
