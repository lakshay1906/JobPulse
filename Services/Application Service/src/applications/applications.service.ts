import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { PrismaService } from '#src/prisma/prisma.service';
import { CreateInterviewDTO } from './dto/create-interview.dto';
import { lastValueFrom } from 'rxjs';
import * as microservices from '@nestjs/microservices';
import {
  INTERVIEW_SERVICE_NAME,
  InterviewServiceClient,
} from '#src/generated/interview';

@Injectable()
export class ApplicationsService implements OnModuleInit {
  private interviewService!: InterviewServiceClient;
  constructor(
    private readonly prisma: PrismaService,
    @Inject('INTERVIEW_PACKAGE') private client: microservices.ClientGrpc,
  ) {}

  onModuleInit() {
    this.interviewService = this.client.getService<InterviewServiceClient>(
      INTERVIEW_SERVICE_NAME,
    );
  }

  async create(createApplicationDto: CreateApplicationDto, userId: string) {
    const isJobValid = await this.prisma.job.findFirst({
      where: {
        id: createApplicationDto.jobId,
      },
    });
    if (!isJobValid) throw new BadRequestException(`Invalid job`);
    const createdApplication = await this.prisma.application.create({
      data: {
        userId,
        ...createApplicationDto,
      },
    });
    return createdApplication;
  }

  async findAll(userId: string) {
    const allApplications = await this.prisma.application.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
        notes: true,
        appliedAt: true,
        createdAt: true,
        updatedAt: true,
        job: {
          select: {
            id: true,
            title: true,
            jobUrl: true,
            employmentType: true,
            location: true,
            company: {
              select: {
                id: true,
                name: true,
                location: true,
                website: true,
              },
            },
          },
        },
      },
    });
    return allApplications;
  }

  async findOne(id: string, userId: string) {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        status: true,
        notes: true,
        appliedAt: true,
        createdAt: true,
        updatedAt: true,
        job: {
          select: {
            id: true,
            title: true,
            jobUrl: true,
            employmentType: true,
            location: true,
            company: {
              select: {
                id: true,
                name: true,
                location: true,
                website: true,
              },
            },
          },
        },
        statusHistory: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            createdAt: true,
          },
        },
      },
    });
    if (!application) throw new BadRequestException('Id is invalid');
    return application;
  }

  async updateApplicationStatus(
    id: string,
    userId: string,
    status:
      | 'APPLIED'
      | 'SCREENING'
      | 'INTERVIEW'
      | 'OFFER'
      | 'REJECTED'
      | 'WITHDRAWN',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.application.findFirst({
        where: { id, userId },
        select: { status: true },
      });
      if (!current) throw new BadRequestException('Application not found');
      if (current.status === status) {
        throw new BadRequestException(`Application is already ${status}`);
      }

      return tx.application.update({
        where: { id },
        data: {
          status,
          statusHistory: {
            create: { fromStatus: current.status, toStatus: status },
          },
        },
      });
    });
  }

  async createInterview(data: CreateInterviewDTO, userId: string) {
    if (!(await this.isApplicationValid(data.applicationId, userId)))
      throw new BadRequestException('Application is invalid');

    // Call interview service
    const interviewResponse = await lastValueFrom(
      this.interviewService.createInterview({
        ...data,
        userId,
      }),
    );
    return interviewResponse;
  }

  async getInterviewsByApplication(id: string, userId: string) {
    if (!(await this.isApplicationValid(id, userId)))
      throw new BadRequestException('Application is invalid');

    return lastValueFrom(
      this.interviewService.getInterviewByApplication({
        applicationId: id,
        userId,
      }),
    );
  }

  async isApplicationValid(id: string, userId: string) {
    const isValid = await this.prisma.application.findFirst({
      where: {
        id,
        userId,
      },
    });
    return isValid ? true : false;
  }

  update(id: number, updateApplicationDto: UpdateApplicationStatusDto) {
    return `This action updates a #${id} application`;
  }

  remove(id: number) {
    return `This action removes a #${id} application`;
  }
}
