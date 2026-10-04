import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateInterviewRequest,
  GetInterviewByApplicationRequest,
  GetInterviewByApplicationResponse,
  Interview,
} from '#src/generated/interview';
import { PrismaService } from '#src/prisma/prisma.service';

const interviewInclude = {
  rounds: {
    orderBy: { roundNumber: 'asc' },
    include: { feedback: true },
  },
} satisfies Prisma.InterviewInclude;

type InterviewWithRounds = Prisma.InterviewGetPayload<{
  include: typeof interviewInclude;
}>;

function toProto(i: InterviewWithRounds): Interview {
  return {
    id: i.id,
    applicationId: i.applicationId,
    status: i.status,
    scheduledAt: i.scheduledAt?.toISOString(),
    createdAt: i.createdAt.toISOString(),
    rounds: i.rounds.map((r) => ({
      id: r.id,
      roundNumber: r.roundNumber,
      type: r.type,
      status: r.status,
      scheduledAt: r.scheduledAt?.toISOString(),
      feedback: r.feedback.map((f) => ({
        id: f.id,
        interviewer: f.interviewer ?? undefined,
        rating: f.rating ?? undefined,
        comments: f.comments ?? undefined,
      })),
    })),
  };
}

@Injectable()
export class InterviewService {
  constructor(private readonly prisma: PrismaService) {}

  async createInterview(request: CreateInterviewRequest): Promise<Interview> {
    const created = await this.prisma.interview.create({
      data: { ...request, status: 'SCHEDULED' },
      include: interviewInclude,
    });
    return toProto(created);
  }

  async getInterviewById(id: string, userId: string): Promise<Interview> {
    const interview = await this.prisma.interview.findFirst({
      where: { id, userId },
      include: interviewInclude,
    });
    if (!interview) throw new NotFoundException('Interview not found');
    return toProto(interview);
  }

  async getInterviewByApplication(
    request: GetInterviewByApplicationRequest,
  ): Promise<GetInterviewByApplicationResponse> {
    const interviews = await this.prisma.interview.findMany({
      where: { applicationId: request.applicationId, userId: request.userId },
      include: interviewInclude,
      orderBy: { createdAt: 'desc' },
    });
    return { interviews: interviews.map(toProto) };
  }
}
