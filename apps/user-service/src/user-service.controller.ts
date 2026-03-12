import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserServiceService } from './user-service.service';

@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  // Listens for the TCP message from the API Gateway
  @MessagePattern({ cmd: 'verify_user_credentials' })
  async verifyUser(@Payload() data: { username: string; pass: string }) {
    // This will return the user object (if valid) or null
    return this.userServiceService.verifyCredentials(data.username, data.pass);
  }

  @Get()
  getHello(): string {
    return this.userServiceService.getHello();
  }
}
