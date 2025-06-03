import { Test, TestingModule } from '@nestjs/testing';
import { DeductionsService } from './deductions.service';

describe('DeductionsService', () => {
  let service: DeductionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeductionsService],
    }).compile();

    service = module.get<DeductionsService>(DeductionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
