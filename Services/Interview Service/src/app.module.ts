import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { InterviewModule } from './interview/interview.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        publicKey: Buffer.from(
          config.getOrThrow('JWT_PUBLIC_KEY'),
          'base64',
        ).toString(),
        verifyOptions: { algorithms: ['RS256'], issuer: 'jobpulse-auth' },
      }),
    }),
    PrismaModule,
    InterviewModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
