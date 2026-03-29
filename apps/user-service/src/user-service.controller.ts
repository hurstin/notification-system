import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  UpdateNotificationPreferenceDto,
  UserServiceService,
} from './user-service.service';
import { CreateUserDto } from 'apps/api-gateway/src/auth/dto/create-user.dto';
import { UpdatePasswordDto } from 'apps/api-gateway/src/auth/dto/updatePassword.dto';
import { ResetPasswordDto } from 'apps/api-gateway/src/auth/dto/reset-password.dto';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from 'apps/api-gateway/src/auth/dto/update-user.dto';

@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  @MessagePattern({ cmd: 'create_user' })
  async createUser(@Payload() data: CreateUserDto) {
    return this.userServiceService.createUser(data);
  }

  @MessagePattern({ cmd: 'verify_user_credentials' })
  async verifyUser(
    @Payload() data: { email: string; pass: string },
  ): Promise<Record<string, unknown> | null> {
    return this.userServiceService.verifyCredentials(data.email, data.pass);
  }

  @MessagePattern({ cmd: 'verify_email' })
  async verifyEmail(@Payload() token: string) {
    return this.userServiceService.verifyEmail(token);
  }

  @MessagePattern({ cmd: 'update_password' })
  async updatePassword(
    @Payload() data: { userId: number; body: UpdatePasswordDto },
  ) {
    return this.userServiceService.updatePassword(data.userId, data.body);
  }

  @MessagePattern({ cmd: 'forgot_password' })
  async forgotPassword(@Payload() email: string) {
    return this.userServiceService.forgotPassword(email);
  }

  @MessagePattern({ cmd: 'reset_password' })
  async resetPassword(
    @Payload() data: { token: string; body: ResetPasswordDto },
  ) {
    return this.userServiceService.resetPassword(data.token, data.body);
  }

  @MessagePattern({ cmd: 'update_user' })
  async updateProfile(
    @Payload() data: { user: UserDto; updateProfileDto: UpdateUserDto },
  ) {
    return this.userServiceService.updateProfile(
      data.user,
      data.updateProfileDto,
    );
  }

  @MessagePattern({ cmd: 'delete_user' })
  async deleteMe(@Payload() user: UserDto) {
    return this.userServiceService.deleteMe(user);
  }

  @MessagePattern({ cmd: 'get_user_profile' })
  async getUserProfile(@Payload() user: UserDto) {
    return this.userServiceService.getUserProfile(user);
  }

  @MessagePattern({ cmd: 'get_all_users' })
  async getAllUsers() {
    return this.userServiceService.getAllUsers();
  }

  @MessagePattern({ cmd: 'resend_verification_email' })
  async resendVerificationEmail(@Payload() user: UserDto) {
    return this.userServiceService.resendVerificationEmail(user);
  }

  @MessagePattern({ cmd: 'get_notification_preferences' })
  async getNotificationPreferences(@Payload() userId: number) {
    return this.userServiceService.getNotificationPreferences(userId);
  }

  @MessagePattern({ cmd: 'update_notification_preferences' })
  async updateNotificationPreferences(
    @Payload()
    data: {
      userId: number;
      preferences: UpdateNotificationPreferenceDto;
    },
  ) {
    return this.userServiceService.updateNotificationPreferences(
      data.userId,
      data.preferences,
    );
  }
}
