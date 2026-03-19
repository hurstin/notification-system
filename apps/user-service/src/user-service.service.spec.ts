import { Test, TestingModule } from '@nestjs/testing';
import { UserServiceService } from './user-service.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

describe('UserServiceService', () => {
  let service: UserServiceService;
  let repository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const mockUser = {
    userId: 1,
    email: 'test@test.com',
    password: 'hashed_password',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserServiceService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserServiceService>(UserServiceService);
    repository = module.get<{
      findOneBy: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
    }>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyCredentials', () => {
    it('should return user without password if credentials are valid', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.verifyCredentials(
        'test@test.com',
        'password123',
      );

      expect(result).toEqual({ userId: 1, email: 'test@test.com' });

      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: 'test@test.com',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed_password',
      );
    });

    it('should return null if user is not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      const result = await service.verifyCredentials(
        'nonexistent@test.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.verifyCredentials(
        'test@test.com',
        'wrong_password',
      );

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update password if current password is valid', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('new_hashed_password' as never);

      const result = await service.updatePassword(1, {
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
      });

      expect(result).toEqual({ message: 'Password updated successfully' });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'new_hashed_password' }),
      );
    });

    it('should throw error if user not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updatePassword(1, {
          currentPassword: 'old',
          newPassword: 'new',
          confirmPassword: 'new',
        }),
      ).rejects.toThrow();
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token and send email', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      const mailerService = (
        service as unknown as { mailerService: MailerService }
      ).mailerService;

      const result = await service.forgotPassword('test@test.com');

      expect(result.message).toBe('Reset token sent to email');
      expect(repository.save).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mailerService.sendMail).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with a valid token', async () => {
      const userWithToken = {
        ...mockUser,
        passwordResetToken: 'token123',
        passwordResetTokenExpires: new Date(Date.now() + 3600000),
      };
      repository.findOneBy.mockResolvedValue(userWithToken);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never); // Different from old password
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hashed' as never);

      const result = await service.resetPassword('token123', {
        newPassword: 'new',
        confirmPassword: 'new',
      });

      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'new_hashed' }),
      );
    });
  });
});
