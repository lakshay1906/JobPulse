import { Controller } from '@nestjs/common';
import {
  CreateInterviewRequest,
  CreateInterviewResponse,
  InterviewServiceController,
  InterviewServiceControllerMethods,
} from '#src/generated/interview';
import { InterviewService } from './interview.service';

@Controller()
@InterviewServiceControllerMethods()
export class InterviewGrpcController implements InterviewServiceController {
  constructor(private readonly interviewService: InterviewService) {}

  createInterview(
    request: CreateInterviewRequest,
  ): Promise<CreateInterviewResponse> {
    return this.interviewService.createInterview(request);
  }
}
