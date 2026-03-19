import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let client: {
    send: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_token'),
          },
        },
        {
          provide: 'USER_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    client = module.get<{ send: jest.Mock }>('USER_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object without password if credentials are valid', async () => {
      const mockUser = {
        userId: 1,
        email: 'test@test.com',
        password: 'hashed_password',
      };
      client.send.mockReturnValue(of(mockUser));

      const result = await service.validateUser('test@test.com', 'password123');

      expect(result).toEqual({ userId: 1, email: 'test@test.com' });
      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'verify_user_credentials' },
        { email: 'test@test.com', pass: 'password123' },
      );
    });

    it('should return null if user-service returns null', async () => {
      client.send.mockReturnValue(of(null));

      const result = await service.validateUser(
        'test@test.com',
        'wrong_password',
      );

      expect(result).toBeNull();
    });

    it('should return null if there is a TCP connection error', async () => {
      client.send.mockImplementation(() => {
        throw new Error('TCP Error');
      });

      const result = await service.validateUser('test@test.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token', () => {
      const user = { userId: 1, email: 'test@test.com' };
      const result = service.login(user);

      expect(result).toEqual({ access_token: 'mock_token' });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@test.com',
        sub: 1,
      });
    });
  });
});
