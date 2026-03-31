import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationTemplate } from './entities/notification-template.entity';
import { TemplateVersion } from './entities/template-version.entity';
import { TemplateContent } from './entities/template-content.entity';
import { TemplateService } from './template-service.service';
import { TemplateController } from './template-service.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [NotificationTemplate, TemplateVersion, TemplateContent],
        synchronize: true, // Auto-sync entities with DB (dev only)
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      NotificationTemplate,
      TemplateVersion,
      TemplateContent,
    ]),
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplateModule {}
