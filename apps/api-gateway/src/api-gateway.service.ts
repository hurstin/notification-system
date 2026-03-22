import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthUserDto } from './auth/dto/auth-user.dto';
import { UpdateUserDto } from './auth/dto/update-user.dto';

@Injectable()
export class ApiGatewayService {
  constructor(@Inject('USER_SERVICE') private readonly client: ClientProxy) {}

  updateProfile(user: AuthUserDto, updateProfileDto: UpdateUserDto) {
    return this.client.send({ cmd: 'update_user' }, { user, updateProfileDto });
  }

  deleteMe(user: AuthUserDto) {
    return this.client.send({ cmd: 'delete_user' }, user);
  }

  getUserProfile(user: AuthUserDto) {
    return this.client.send({ cmd: 'get_user_profile' }, user);
  }

  getAllUsers() {
    return this.client.send({ cmd: 'get_all_users' }, {});
  }
}
