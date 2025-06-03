import { Test, TestingModule } from '@nestjs/testing';
import { AdditionsService } from './additions.service';

describe('AdditionsService', () => {
  let service: AdditionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdditionsService],
    }).compile();

    service = module.get<AdditionsService>(AdditionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
