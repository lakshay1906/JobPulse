import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { User } from '#src/types/user';
import { AuthGuard } from '#src/auth.guard';
import { Interview } from '#src/generated/interview';

// interview/interview-http.controller.ts For REST APIs
@Controller('interviews')
export class InterviewHttpController {
  constructor(private readonly interviewService: InterviewService) {}

  @UseGuards(AuthGuard)
  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: User },
  ): Promise<Interview> {
    return this.interviewService.getInterviewById(id, req.user.sub);
  }
}
