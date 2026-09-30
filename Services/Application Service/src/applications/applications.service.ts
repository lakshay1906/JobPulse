import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
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
    });
    return allApplications;
  }

  findOne(id: number) {
    return `This action returns a #${id} application`;
  }

  update(id: number, updateApplicationDto: UpdateApplicationDto) {
    return `This action updates a #${id} application`;
  }

  remove(id: number) {
    return `This action removes a #${id} application`;
  }
}
