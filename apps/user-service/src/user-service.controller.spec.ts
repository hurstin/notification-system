import { Test, TestingModule } from '@nestjs/testing';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

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
          provide: getRepositoryToken(NotificationPreference),
          useValue: {}, // mock repository
        },
        {
          provide: 'EMAIL_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: 'PUSH_SERVICE',
          useValue: {
            emit: jest.fn(),
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
