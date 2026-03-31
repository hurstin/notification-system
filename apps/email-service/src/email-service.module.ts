import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MailerModule } from '@nestjs-modules/mailer';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisModule, RateLimitModule } from '@app/shared';

import { EmailServiceController } from './email-service.controller';
import { EmailService } from './email-service.service';

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
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST', 'localhost'),
          port: config.get<number>('SMTP_PORT', 1025),
          auth: {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"Notification System" <${config.get('SMTP_FROM', 'noreply@example.com')}>`,
        },
      }),
      inject: [ConfigService],
    }),
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
  controllers: [EmailServiceController],
  providers: [EmailService],
})
export class EmailServiceModule {}
