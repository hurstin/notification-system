import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from 'apps/api-gateway/src/auth/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
import { addHours } from 'date-fns'; // npm i date-fns
import { UpdatePasswordDto } from 'apps/api-gateway/src/auth/dto/updatePassword.dto';
import { ResetPasswordDto } from 'apps/api-gateway/src/auth/dto/reset-password.dto';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from 'apps/api-gateway/src/auth/dto/update-user.dto';

@Injectable()
export class UserServiceService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailerService: MailerService,
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
    });

    // send verification token to email

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to Notification System! Confirm your Email',
      html: `
        <h3>Welcome ${user.name}!</h3>
        <p>Please click the link below to verify your email address:</p>
        <p>
          <a href="http://localhost:3000/auth/verify?token=${emailToken}">Verify Email</a>
        </p>
        <p>This token expires in 1 hour.</p>
      `,
    });

    // save user
    const savedUser = await this.usersRepository.save(user);

    // remove password from user object before returning

    // Map only the non-sensitive fields to the response object
    const newUser = {
      userId: savedUser.userId,
      name: savedUser.name,
      email: savedUser.email,
      isEmailVerified: savedUser.isEmailVerified,
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
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset Password',
      html: `
        <h3>Reset Password</h3>
        <p>Please click the link below to reset your password:</p>
        <p>
          <a href="http://localhost:3000/auth/reset-password?token=${resetToken}">Reset Password</a>
        </p>
        <p>This token expires in 1 hour.</p>
      `,
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
}
