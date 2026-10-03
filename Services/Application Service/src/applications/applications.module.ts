import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INTERVIEW_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'interview',
          protoPath: join(process.cwd(), '../../proto/interview.proto'),
          url: 'localhost:50051',
        },
      },
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
