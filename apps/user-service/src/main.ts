import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0', // Bind to all interfaces (important for Docker)
        port: 3001, // Must match the API Gateway ClientProxy port
      },
    },
  );
  await app.listen();
}
void bootstrap();
