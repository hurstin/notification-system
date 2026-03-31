import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { CreateUserDto } from 'apps/api-gateway/src/auth/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
import { addHours } from 'date-fns'; // npm i date-fns
import { UpdatePasswordDto } from 'apps/api-gateway/src/auth/dto/updatePassword.dto';
import { ResetPasswordDto } from 'apps/api-gateway/src/auth/dto/reset-password.dto';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from 'apps/api-gateway/src/auth/dto/update-user.dto';
import { RedisService } from '@app/shared';

export class UpdateNotificationPreferenceDto {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
}

@Injectable()
export class UserServiceService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
    @Inject('PUSH_SERVICE') private readonly pushClient: ClientProxy,
    private readonly redisService: RedisService,
  ) {}

  async createUser(
    data: CreateUserDto,
  ): Promise<{ newUser: Partial<User>; message: string }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const emailToken: string = uuidv4() as string;
    const tokenExpires: Date = addHours(new Date(), 1); //expires in 1 hour

    // check if username exist
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new RpcException({ status: 409, message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // create user object (spread DTO, set hashed password)
    const user = this.usersRepository.create({
      ...data,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: String(emailToken),
      emailVerificationTokenExpires: new Date(tokenExpires),
      notificationPreference: this.preferenceRepository.create(), // Default preferences
    });

    // save user first so we have the userId for the notification payload
    const savedUser = await this.usersRepository.save(user);

    // send verification token to email
    this.emailClient.emit('send_email', {
      to: savedUser.email,
      subject: 'Welcome to Notification System! Confirm your Email',
      templateName: 'WELCOME_EMAIL',
      templateVariables: {
        name: savedUser.name,
        verifyUrl: `http://localhost:3000/auth/verify?token=${emailToken}`,
      },
      userId: savedUser.userId,
    });

    // remove password from user object before returning

    // Map only the non-sensitive fields to the response object
    const newUser = {
      userId: savedUser.userId,
      name: savedUser.name,
      email: savedUser.email,
      isEmailVerified: savedUser.isEmailVerified,
      notificationPreference: savedUser.notificationPreference,
    };
    return {
      newUser,
      message: 'User created successfully',
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async verifyEmail(token: string) {
    const user = await this.usersRepository.findOneBy({
      emailVerificationToken: token,
    });
    if (!user) {
      throw new RpcException({ status: 404, message: 'Invalid token' });
    }
    if (user.isEmailVerified) {
      throw new RpcException({
        status: 400,
        message: 'Email already verified',
      });
    }

    // check if token has expired
    if (!user.emailVerificationTokenExpires) {
      throw new RpcException({
        status: 400,
        message: 'Verification token has no expiration date.',
      });
    }
    if (user.emailVerificationTokenExpires < new Date()) {
      throw new RpcException({ status: 400, message: 'Token expired' });
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    await this.usersRepository.save(user);
    return { message: 'Email verified successfully' };
  }

  async verifyCredentials(
    email: string,
    pass: string,
  ): Promise<Record<string, unknown> | null> {
    const user = await this.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async updatePassword(userId: number, body: UpdatePasswordDto) {
    // check if user exists
    const user = await this.usersRepository.findOneBy({ userId });

    if (!user) {
      throw new RpcException({ status: 404, message: 'User not found' });
    }

    // check if current password is correct
    const isCurrentPasswordValid = await bcrypt.compare(
      body.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new RpcException({
        status: 401,
        message: 'Invalid current password',
      });
    }

    // hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(body.newPassword, salt);

    // update password
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await this.usersRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(email: string) {
    // check if user exists
    const user = await this.findByEmail(email);

    if (!user) {
      throw new RpcException({
        status: 404,
        message: 'User not found with this email',
      });
    }

    // generate reset token
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const resetToken: string = uuidv4() as string;
    const resetTokenExpires: Date = addHours(new Date(), 1);

    // save resetToken and resetTokenExpires
    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpires = resetTokenExpires;
    await this.usersRepository.save(user);

    // send reset token to email
    this.emailClient.emit('send_email', {
      to: user.email,
      subject: 'Reset Password',
      templateName: 'PASSWORD_RESET',
      templateVariables: {
        userName: user.name,
        resetLink: `http://localhost:3000/auth/reset-password?token=${resetToken}`,
      },
      userId: user.userId,
    });

    // return success message
    return {
      message: 'Reset token sent to email',
      resetToken,
      resetTokenExpires,
    };
  }

  async resetPassword(token: string, body: ResetPasswordDto) {
    // check if token is valid and not expired
    const user = await this.usersRepository.findOneBy({
      passwordResetToken: token,
    });
    if (!user) {
      throw new RpcException({ status: 404, message: 'Invalid token' });
    }

    if (!user.passwordResetTokenExpires) {
      throw new RpcException({
        status: 400,
        message: 'Token has no expiration date.',
      });
    }

    if (user.passwordResetTokenExpires < new Date()) {
      throw new RpcException({ status: 400, message: 'Token expired' });
    }

    // compare new password with current password
    const isCurrentPasswordValid = await bcrypt.compare(
      body.newPassword,
      user.password,
    );
    if (isCurrentPasswordValid) {
      throw new RpcException({
        status: 400,
        message: 'New password cannot be same as current password',
      });
    }

    // hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(body.newPassword, salt);

    // update password
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    user.passwordChangedAt = new Date();
    await this.usersRepository.save(user);

    return { message: 'Password reset successfully' };
  }

  async updateProfile(user: UserDto, updateProfileDto: UpdateUserDto) {
    const existingUser = await this.usersRepository.findOneBy({
      userId: user.userId,
    });
    if (!existingUser) {
      throw new RpcException({ status: 404, message: 'User not found' });
    }
    if (existingUser.email !== updateProfileDto.email) {
      const existingUserWithSameEmail = await this.usersRepository.findOneBy({
        email: updateProfileDto.email,
      });
      if (existingUserWithSameEmail) {
        throw new RpcException({
          status: 400,
          message: 'Email already exists',
        });
      }
    }

    existingUser.name = updateProfileDto.name;
    existingUser.email = updateProfileDto.email;
    await this.usersRepository.save(existingUser);
    return { message: 'Profile updated successfully' };
  }

  async deleteMe(user: UserDto) {
    const existingUser = await this.usersRepository.findOneBy({
      userId: user.userId,
    });
    if (!existingUser) {
      throw new RpcException({ status: 404, message: 'User not found' });
    }
    await this.usersRepository.remove(existingUser);

    return { message: 'User deleted successfully' };
  }

  async getUserProfile(user: UserDto) {
    const existingUser = await this.usersRepository.findOneBy({
      userId: user.userId,
    });
    if (!existingUser) {
      throw new RpcException({ status: 404, message: 'User not found' });
    }

    this.pushClient.emit('send_push', {
      tokens: ['TOKEN_123'],
      title: 'Profile viewed',
      body: 'Your profile',
    });

    return {
      userId: existingUser.userId,
      name: existingUser.name,
      email: existingUser.email,
      isEmailVerified: existingUser.isEmailVerified,
    };
  }

  async getAllUsers() {
    const users = await this.usersRepository.find();
    return users.map((user) => {
      return {
        userId: user.userId,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      };
    });
  }

  async resendVerificationEmail(user: UserDto) {
    const existingUser = await this.usersRepository.findOneBy({
      userId: user.userId,
    });
    if (!existingUser) {
      throw new RpcException({ status: 404, message: 'User not found' });
    }
    if (existingUser.isEmailVerified) {
      throw new RpcException({
        status: 400,
        message: 'Email already verified',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const verificationToken = uuidv4() as string;
    const verificationTokenExpires = addHours(new Date(), 1);
    existingUser.emailVerificationToken = verificationToken;
    existingUser.emailVerificationTokenExpires = verificationTokenExpires;

    this.emailClient.emit('send_email', {
      to: existingUser.email,
      subject: 'Verify your email',
      templateName: 'WELCOME_EMAIL', // You can use a generic verify email template later
      templateVariables: {
        userName: existingUser.name,
        verifyLink: `http://localhost:3000/auth/verify-email?token=${verificationToken}`,
      },
      userId: existingUser.userId,
    });
    await this.usersRepository.save(existingUser);
    return { message: 'Verification email sent successfully' };
  }

  async getNotificationPreferences(userId: number) {
    const preferences = await this.preferenceRepository.findOne({
      where: { user: { userId } },
    });
    if (!preferences) {
      throw new RpcException({ status: 404, message: 'Preferences not found' });
    }
    return preferences;
  }

  async updateNotificationPreferences(
    userId: number,
    data: UpdateNotificationPreferenceDto,
  ) {
    const preferences = await this.preferenceRepository.findOne({
      where: { user: { userId } },
    });
    if (!preferences) {
      throw new RpcException({ status: 404, message: 'Preferences not found' });
    }
    Object.assign(preferences, data);
    await this.preferenceRepository.save(preferences);

    // Mirror to Redis (cache) for fast access by email/push services
    await this.redisService.set(`user_prefs:${userId}`, {
      emailEnabled: preferences.emailEnabled,
      pushEnabled: preferences.pushEnabled,
    });

    return { message: 'Preferences updated successfully' };
  }
}
