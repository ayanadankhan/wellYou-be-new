import { Test, TestingModule } from '@nestjs/testing';
import { AnswerSurveyService } from './answer-survey.service';

describe('AnswerSurveyService', () => {
  let service: AnswerSurveyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnswerSurveyService],
    }).compile();

    service = module.get<AnswerSurveyService>(AnswerSurveyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
