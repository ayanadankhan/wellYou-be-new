import { Test, TestingModule } from '@nestjs/testing';
import { QuestionSurveyService } from './question-survey.service';

describe('QuestionSurveyService', () => {
  let service: QuestionSurveyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionSurveyService],
    }).compile();

    service = module.get<QuestionSurveyService>(QuestionSurveyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
