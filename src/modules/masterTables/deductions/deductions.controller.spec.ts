import { Test, TestingModule } from '@nestjs/testing';
import { DeductionsController } from './deductions.controller';
import { DeductionsService } from './deductions.service';

describe('DeductionsController', () => {
  let controller: DeductionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeductionsController],
      providers: [DeductionsService],
    }).compile();

    controller = module.get<DeductionsController>(DeductionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
