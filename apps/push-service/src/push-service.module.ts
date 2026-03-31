import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisModule, RateLimitModule } from '@app/shared';
import { PushServiceController } from './push-service.controller';
import { PushService } from './push-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      ttl: 900000, // 15 minutes local cache
      max: 100,
    }),
    RedisModule.forRoot(),
    RateLimitModule,
    ClientsModule.register([
      {
        name: 'TEMPLATE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'template-service',
          port: 3003,
        },
      },
    ]),
  ],
  controllers: [PushServiceController],
  providers: [PushService],
})
export class PushServiceModule {}
