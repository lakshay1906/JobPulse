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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { AuthGuard } from '#src/auth.guard';
import { User } from '#src/types/user';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(+id, updateApplicationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(+id);
  }
}
