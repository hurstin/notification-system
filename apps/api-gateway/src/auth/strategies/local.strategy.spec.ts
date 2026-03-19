import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the user if validation succeeds', async () => {
      const mockUser = { userId: 1, email: 'test@test.com' };
      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await strategy.validate('test@test.com', 'password123');

      expect(result).toEqual(mockUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@test.com',
        'password123',
      );
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        strategy.validate('test@test.com', 'wrong_password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
