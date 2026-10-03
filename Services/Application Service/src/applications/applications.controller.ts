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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { AuthGuard } from '#src/auth.guard';
import { User } from '#src/types/user';
import { CreateInterviewDTO } from './dto/create-interview.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Req()
    request: {
      user: User;
    },
  ) {
    return this.applicationsService.create(
      createApplicationDto,
      request.user.sub,
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() request: { user: User }) {
    return this.applicationsService.findAll(request.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: { user: User },
  ) {
    return this.applicationsService.findOne(id, request.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/status')
  updateApplicationStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { status }: UpdateApplicationStatusDto,
    @Req() request: { user: User },
  ) {
    return this.applicationsService.updateApplicationStatus(
      id,
      request.user.sub,
      status,
    );
  }

  @UseGuards(AuthGuard)
  @Post('create-interview')
  createInterview(
    @Body() createInterviewDto: CreateInterviewDTO,
    @Req() request: { user: User },
  ) {
    return this.applicationsService.createInterview(
      createInterviewDto,
      request.user.sub,
    );
  }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateApplicationDto: UpdateApplicationDto,
  // ) {
  //   return this.applicationsService.update(+id, updateApplicationDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.applicationsService.remove(+id);
  // }
}
