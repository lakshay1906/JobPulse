import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewGrpcController } from './interview.controller';
import { InterviewHttpController } from './interview-http.controller';

@Module({
  controllers: [InterviewGrpcController, InterviewHttpController],
  providers: [InterviewService],
})
export class InterviewModule {}
