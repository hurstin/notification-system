import { Inject, Injectable, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError } from 'rxjs';
import { AuthUserDto } from './auth/dto/auth-user.dto';
import { UpdateUserDto } from './auth/dto/update-user.dto';
import { UpdateNotificationPreferenceDto } from './auth/dto/update-notification-preference.dto';

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

  private catchError = (error: { message: string; status: number }) => {
    return throwError(
      () =>
        new HttpException(
          error.message || 'Internal server error',
          error.status || 500,
        ),
    );
  };

  getNotificationPreferences(userId: number) {
    return this.client
      .send({ cmd: 'get_notification_preferences' }, userId)
      .pipe(catchError(this.catchError));
  }

  updateNotificationPreferences(
    userId: number,
    preferences: UpdateNotificationPreferenceDto,
  ) {
    return this.client
      .send({ cmd: 'update_notification_preferences' }, { userId, preferences })
      .pipe(catchError(this.catchError));
  }
}
