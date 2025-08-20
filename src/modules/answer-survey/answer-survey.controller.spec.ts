import { Test, TestingModule } from '@nestjs/testing';
import { AnswerSurveyController } from './answer-survey.controller';
import { AnswerSurveyService } from './answer-survey.service';

describe('AnswerSurveyController', () => {
  let controller: AnswerSurveyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnswerSurveyController],
      providers: [AnswerSurveyService],
    }).compile();

    controller = module.get<AnswerSurveyController>(AnswerSurveyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
