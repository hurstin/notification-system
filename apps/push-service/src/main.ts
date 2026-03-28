import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PushServiceModule } from './push-service.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('PushService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PushServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'push-queue',
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  await app.listen();
  logger.log('Push Microservice is listening on RabbitMQ...');
}
bootstrap().catch((err: Error) => {
  new Logger('Bootstrap').error(
    `Failed to start Push Microservice: ${err.message}`,
    err.stack,
  );
});
