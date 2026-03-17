import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserServiceService } from './user-service.service';
import { CreateUserDto } from 'apps/api-gateway/src/auth/dto/create-user.dto';

@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  @MessagePattern({ cmd: 'create_user' })
  async createUser(@Payload() data: CreateUserDto) {
    return this.userServiceService.createUser(data);
  }

  @MessagePattern({ cmd: 'verify_user_credentials' })
  async verifyUser(
    @Payload() data: { username: string; pass: string },
  ): Promise<Record<string, unknown> | null> {
    return this.userServiceService.verifyCredentials(data.username, data.pass);
  }

  @Get()
  getHello(): string {
    return this.userServiceService.getHello();
  }
}
