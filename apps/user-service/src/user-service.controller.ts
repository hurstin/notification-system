import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserServiceService } from './user-service.service';
import { VerifyUserDto } from './dto/verify-user.dto';
import { UserDto } from './dto/user.dto';

@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  // Listens for the TCP message from the API Gateway
  @MessagePattern({ cmd: 'verify_user_credentials' })
    // NEED TO BE FIXED 5
  async verifyUser(@Payload() data: VerifyUserDto): Promise<UserDto | null> {
    // This will return the user object (if valid) or null
    return this.userServiceService.verifyCredentials(data.username, data.pass);
  }

  @Get()
  getHello(): string {
    return this.userServiceService.getHello();
  }
}
