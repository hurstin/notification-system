import { Inject, Injectable, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError } from 'rxjs';
import { AuthUserDto } from './auth/dto/auth-user.dto';
import { UpdateUserDto } from './auth/dto/update-user.dto';
import { UpdateNotificationPreferenceDto } from './auth/dto/update-notification-preference.dto';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class ApiGatewayService {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
    @Inject('TEMPLATE_SERVICE') private readonly templateClient: ClientProxy,
  ) {}

  updateProfile(user: AuthUserDto, updateProfileDto: UpdateUserDto) {
    return this.userServiceClient.send(
      { cmd: 'update_user' },
      { user, updateProfileDto },
    );
  }

  deleteMe(user: AuthUserDto) {
    return this.userServiceClient.send({ cmd: 'delete_user' }, user);
  }

  getUserProfile(user: AuthUserDto) {
    return this.userServiceClient.send({ cmd: 'get_user_profile' }, user);
  }

  getAllUsers() {
    return this.userServiceClient.send({ cmd: 'get_all_users' }, {});
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
    return this.userServiceClient
      .send({ cmd: 'get_notification_preferences' }, userId)
      .pipe(catchError(this.catchError));
  }

  updateNotificationPreferences(
    userId: number,
    preferences: UpdateNotificationPreferenceDto,
  ) {
    return this.userServiceClient
      .send({ cmd: 'update_notification_preferences' }, { userId, preferences })
      .pipe(catchError(this.catchError));
  }

  // Template Management
  getTemplate(
    name: string,
    lang?: string,
    variables?: Record<string, unknown>,
  ) {
    return this.templateClient
      .send({ cmd: 'get_template' }, { name, lang, variables })
      .pipe(catchError(this.catchError));
  }

  createTemplate(data: CreateTemplateDto) {
    return this.templateClient
      .send({ cmd: 'create_template' }, data)
      .pipe(catchError(this.catchError));
  }

  updateTemplate(name: string, data: any) {
    return this.templateClient
      .send({ cmd: 'update_template' }, { name, ...data })
      .pipe(catchError(this.catchError));
  }

  listTemplates() {
    return this.templateClient
      .send({ cmd: 'list_templates' }, {})
      .pipe(catchError(this.catchError));
  }
}
