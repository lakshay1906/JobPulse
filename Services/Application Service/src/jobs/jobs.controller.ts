import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { AuthGuard } from '#src/auth.guard';
import { User } from '#src/types/user';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createJobDto: CreateJobDto, @Req() req: { user: User }) {
    return this.jobsService.create(createJobDto, req.user.sub);
  }

  // @Get()
  // findAll() {
  //   return this.jobsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.jobsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
  //   return this.jobsService.update(+id, updateJobDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.jobsService.remove(+id);
  // }
}
