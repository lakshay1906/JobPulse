import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { PrismaService } from '#src/prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

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

  update(id: number, updateApplicationDto: UpdateApplicationStatusDto) {
    return `This action updates a #${id} application`;
  }

  remove(id: number) {
    return `This action removes a #${id} application`;
  }
}
