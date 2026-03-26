import { Test, TestingModule } from '@nestjs/testing';
import { EmailServiceController } from './email-service.controller';
import { EmailService } from './email-service.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

describe('EmailServiceController', () => {
  let controller: EmailServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailServiceController],
      providers: [
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmailServiceController>(EmailServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
