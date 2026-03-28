import { Test, TestingModule } from '@nestjs/testing';
import { PushServiceController } from './push-service.controller';
import { PushService } from './push-service.service';
import { SendPushDto } from './dto/send-push.dto';

describe('PushServiceController', () => {
  let controller: PushServiceController;

  const mockPushService = {
    sendPush: jest.fn(),
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushServiceController],
      providers: [
        {
          provide: PushService,
          useValue: mockPushService,
        },
      ],
    }).compile();

    controller = module.get<PushServiceController>(PushServiceController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSendPush', () => {
    it('should call pushService.sendPush with the provided data', async () => {
      const dto: SendPushDto = {
        tokens: ['token1'],
        title: 'Test Title',
        body: 'Test Body',
      };

      await controller.handleSendPush(dto);

      expect(mockPushService.sendPush).toHaveBeenCalledWith(dto);
    });
  });

  describe('sendPush', () => {
    it('should call pushService.sendPush and return success message', async () => {
      const dto: SendPushDto = {
        tokens: ['token1'],
        title: 'Test Title',
        body: 'Test Body',
      };

      const result = await controller.sendPush(dto);

      expect(mockPushService.sendPush).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        success: true,
        message: 'Push notification sent successfully',
      });
    });
  });

  describe('validateToken', () => {
    it('should call pushService.validateToken and return its result', async () => {
      const data = { token: 'valid-token' };
      mockPushService.validateToken.mockResolvedValue(true);

      const result = await controller.validateToken(data);

      expect(mockPushService.validateToken).toHaveBeenCalledWith(data.token);
      expect(result).toEqual({ isValid: true });
    });

    it('should return isValid: false if pushService.validateToken returns false', async () => {
      const data = { token: 'invalid-token' };
      mockPushService.validateToken.mockResolvedValue(false);

      const result = await controller.validateToken(data);

      expect(mockPushService.validateToken).toHaveBeenCalledWith(data.token);
      expect(result).toEqual({ isValid: false });
    });
  });
});
