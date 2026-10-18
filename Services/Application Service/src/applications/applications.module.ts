import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { RedisModule } from '#src/redis/redis.module';

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
          loader: { arrays: true, keepCase: true },
        },
      },
    ]),
    RedisModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
