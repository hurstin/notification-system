import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let module: TestingModule;
  let client: {
    send: jest.Mock;
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_token'),
            decode: jest
              .fn()
              .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
          },
        },
        {
          provide: 'USER_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn(),
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
    it('should return an access token and user email', () => {
      const user = { userId: 1, email: 'test@test.com' };
      const result = service.login(user);

      expect(result).toEqual({
        user: 'test@test.com',
        access_token: 'mock_token',
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@test.com',
        sub: 1,
      });
    });
  });

  describe('updatePassword', () => {
    it('should send update_password command to user-service', (done) => {
      const userId = 1;
      const body = {
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
      };
      client.send.mockReturnValue(of({ message: 'Success' }));

      service.updatePassword(userId, body).subscribe((result) => {
        expect(result).toEqual({ message: 'Success' });
        expect(client.send).toHaveBeenCalledWith(
          { cmd: 'update_password' },
          { userId, body },
        );
        done();
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot_password command to user-service', (done) => {
      const email = 'test@test.com';
      client.send.mockReturnValue(of({ message: 'Email sent' }));

      service.forgotPassword(email).subscribe((result) => {
        expect(result).toEqual({ message: 'Email sent' });
        expect(client.send).toHaveBeenCalledWith(
          { cmd: 'forgot_password' },
          email,
        );
        done();
      });
    });
  });

  describe('resetPassword', () => {
    it('should send reset_password command to user-service', (done) => {
      const token = 'token123';
      const body = { newPassword: 'new', confirmPassword: 'new' };
      client.send.mockReturnValue(of({ message: 'Success' }));

      service.resetPassword(token, body).subscribe((result) => {
        expect(result).toEqual({ message: 'Success' });
        expect(client.send).toHaveBeenCalledWith(
          { cmd: 'reset_password' },
          { token, body },
        );
        done();
      });
    });
  });
  describe('logout', () => {
    it('should blacklist the token in Redis if provided', async () => {
      const user = { userId: 1, email: 'test@test.com' };
      const token = 'mock_token';
      const redisClient = module.get<{ set: jest.Mock }>('REDIS_CLIENT');

      const result = await service.logout(user, token);

      expect(result).toEqual({
        message: 'test@test.com logged out successfully.',
      });

      expect(redisClient.set).toHaveBeenCalled();
    });

    it('should still logout if no token is provided', async () => {
      const user = { userId: 1, email: 'test@test.com' };
      const result = await service.logout(user);

      expect(result).toEqual({
        message: 'test@test.com logged out successfully.',
      });
    });
  });
});
