import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthModule } from '#src/auth/auth.module';
import { RedisModule } from '#src/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
