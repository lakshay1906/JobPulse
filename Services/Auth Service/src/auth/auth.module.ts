import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '#src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: Buffer.from(
          config.getOrThrow('JWT_PRIVATE_KEY'),
          'base64',
        ).toString(),
        publicKey: Buffer.from(
          config.getOrThrow('JWT_PUBLIC_KEY'),
          'base64',
        ).toString(),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: '15m',
          issuer: 'jobpulse-auth',
        },
        verifyOptions: { algorithms: ['RS256'], issuer: 'jobpulse-auth' },
      }),
    }),
  ],
})
export class AuthModule {}
