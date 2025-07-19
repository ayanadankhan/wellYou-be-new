import { Test, TestingModule } from '@nestjs/testing';
import { requestMangmentervice } from './request-mangment.service';

describe('requestMangmentervice', () => {
  let service: requestMangmentervice;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [requestMangmentervice],
    }).compile();

    service = module.get<requestMangmentervice>(requestMangmentervice);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
