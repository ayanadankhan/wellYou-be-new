import { Test, TestingModule } from '@nestjs/testing';
import { RequestMangmentController } from './request-mangment.controller';
import { requestMangmentervice } from './request-mangment.service';

describe('RequestMangmentController', () => {
  let controller: RequestMangmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestMangmentController],
      providers: [requestMangmentervice],
    }).compile();

    controller = module.get<RequestMangmentController>(RequestMangmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
