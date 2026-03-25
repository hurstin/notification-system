import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EmailServiceModule } from './email-service.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('EmailService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EmailServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'email-queue',
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  await app.listen();
  logger.log('Email Microservice is listening on RabbitMQ...');
}
bootstrap().catch((err: Error) => {
  new Logger('Bootstrap').error(
    `Failed to start Email Microservice: ${err.message}`,
    err.stack,
  );
});
