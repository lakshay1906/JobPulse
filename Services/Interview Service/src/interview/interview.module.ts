import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewGrpcController } from './interview.controller';

@Module({
  controllers: [InterviewGrpcController],
  providers: [InterviewService],
})
export class InterviewModule {}
