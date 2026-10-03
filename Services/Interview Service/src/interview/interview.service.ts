import {
  CreateInterviewRequest,
  CreateInterviewResponse,
} from '#src/generated/interview';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InterviewService {
  async createInterview(request: CreateInterviewRequest) {
    return {
      id: '1',
      applicationId: request.applicationId,
      status: 'SCHEDULED',
      scheduledAt: request.scheduledAt,
      createdAt: new Date().toISOString(),
    };
  }
}
