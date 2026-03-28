import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PushServiceController } from './push-service.controller';
import { PushService } from './push-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [PushServiceController],
  providers: [PushService],
})
export class PushServiceModule {}
