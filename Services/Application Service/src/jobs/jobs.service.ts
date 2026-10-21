import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PrismaService } from '#src/prisma/prisma.service';
import { RedisService } from '#src/redis/redis.service';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(createJobDto: CreateJobDto, userId: string) {
    const isCompanyExists = await this.prisma.company.findFirst({
      where: {
        id: createJobDto.companyId,
        userId,
      },
    });
    if (!isCompanyExists) throw new BadRequestException('Invalid company');

    const createdJob = await this.prisma.job.create({
      data: createJobDto,
    });
    await this.redis.del(`app:dashboard:stats:user:${userId}`);
    return createdJob;
  }

  findAll() {
    return `This action returns all jobs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} job`;
  }

  update(id: number, updateJobDto: UpdateJobDto) {
    return `This action updates a #${id} job`;
  }

  remove(id: number) {
    return `This action removes a #${id} job`;
  }
}
