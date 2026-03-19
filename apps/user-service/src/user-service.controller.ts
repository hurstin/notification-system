import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserServiceService } from './user-service.service';
import { CreateUserDto } from 'apps/api-gateway/src/auth/dto/create-user.dto';
import { UpdatePasswordDto } from 'apps/api-gateway/src/auth/dto/updatePassword.dto';
import { ResetPasswordDto } from 'apps/api-gateway/src/auth/dto/reset-password.dto';

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

  @Get()
  getHello(): string {
    return this.userServiceService.getHello();
  }
}
