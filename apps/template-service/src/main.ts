import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { TemplateModule } from './template-service.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('TemplateService');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TemplateModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3003,
      },
    },
  );
  await app.listen();
  logger.log('Template Microservice is listening on port 3003');
}
bootstrap().catch((err) => {
  console.error('Error starting server', err);
});
