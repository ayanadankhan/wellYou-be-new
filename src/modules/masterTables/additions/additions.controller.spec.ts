import { Test, TestingModule } from '@nestjs/testing';
import { AdditionsController } from './additions.controller';
import { AdditionsService } from './additions.service';

describe('AdditionsController', () => {
  let controller: AdditionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdditionsController],
      providers: [AdditionsService],
    }).compile();

    controller = module.get<AdditionsController>(AdditionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
