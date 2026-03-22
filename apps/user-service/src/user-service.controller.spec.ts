import { Test, TestingModule } from '@nestjs/testing';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MailerService } from '@nestjs-modules/mailer';

describe('UserServiceController', () => {
  let userServiceController: UserServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserServiceController],
      providers: [
        UserServiceService,
        {
          provide: getRepositoryToken(User),
          useValue: {}, // mock repository
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    userServiceController = app.get<UserServiceController>(
      UserServiceController,
    );
  });

  it('should be defined', () => {
    expect(userServiceController).toBeDefined();
  });
});
