import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import {
  CreateInterviewRequest,
  GetInterviewByApplicationRequest,
  GetInterviewByApplicationResponse,
  Interview,
} from '#src/generated/interview';
import { PrismaService } from '#src/prisma/prisma.service';
import { RedisService } from '#src/redis/redis.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createInterview(request: CreateInterviewRequest): Promise<Interview> {
    const created = await this.prisma.interview.create({
      data: { ...request, status: 'SCHEDULED' },
      include: interviewInclude,
    });
    await this.redis.del(`interview:one:${request.userId}:${created.id}`);
    return toProto(created);
  }

  async getInterviewById(id: string, userId: string): Promise<Interview> {
    const key = `interview:one:${userId}:${id}`;
    const cachedData = await this.redis.getJson<Interview>(key);
    if (cachedData) {
      return cachedData;
    }
    const interview = await this.prisma.interview.findFirst({
      where: { id, userId },
      include: interviewInclude,
    });
    if (!interview) throw new NotFoundException('Interview not found');
    const payload = toProto(interview);
    await this.redis.setJson(key, payload, 3600);
    return payload;
  }

  async getInterviewByApplication({
    applicationId,
    userId,
  }: GetInterviewByApplicationRequest): Promise<GetInterviewByApplicationResponse> {
    const interviews = await this.prisma.interview.findMany({
      where: { applicationId, userId },
      include: interviewInclude,
      orderBy: { createdAt: 'desc' },
    });
    return { interviews: interviews.map(toProto) };
  }
}
