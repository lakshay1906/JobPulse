import { Test, TestingModule } from '@nestjs/testing';
import { InterviewHttpController } from '#src/interview/interview-http.controller';
import { InterviewService } from './interview.service';

describe('InterviewController', () => {
  let controller: InterviewHttpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewHttpController],
      providers: [InterviewService],
    }).compile();

    controller = module.get<InterviewHttpController>(InterviewHttpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
