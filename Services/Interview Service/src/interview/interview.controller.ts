import { Controller } from '@nestjs/common';
import {
  CreateInterviewRequest,
  GetInterviewByApplicationRequest,
  GetInterviewByApplicationResponse,
  Interview,
  InterviewServiceController,
  InterviewServiceControllerMethods,
} from '#src/generated/interview';
import { InterviewService } from './interview.service';

@Controller()
@InterviewServiceControllerMethods()
export class InterviewGrpcController implements InterviewServiceController {
  constructor(private readonly interviewService: InterviewService) {}

  createInterview(request: CreateInterviewRequest): Promise<Interview> {
    return this.interviewService.createInterview(request);
  }

  getInterviewByApplication(
    request: GetInterviewByApplicationRequest,
  ): Promise<GetInterviewByApplicationResponse> {
    return this.interviewService.getInterviewByApplication(request);
  }
}
