import { Inject, Injectable, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError } from 'rxjs';
import { AuthUserDto } from './auth/dto/auth-user.dto';
import { UpdateUserDto } from './auth/dto/update-user.dto';
import { UpdateNotificationPreferenceDto } from './auth/dto/update-notification-preference.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { RegisterDeviceTokenDto } from './dto/device-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

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

  deleteTemplate(name: string) {
    return this.templateClient
      .send({ cmd: 'delete_template' }, name)
      .pipe(catchError(this.catchError));
  }

  registerDeviceToken(userId: number, body: RegisterDeviceTokenDto) {
    return this.userServiceClient
      .send({ cmd: 'register_device_token' }, { userId, ...body })
      .pipe(catchError(this.catchError));
  }

  deleteDeviceToken(userId: number, token: string) {
    return this.userServiceClient
      .send({ cmd: 'delete_device_token' }, { userId, token })
      .pipe(catchError(this.catchError));
  }

  sendNotification(body: SendNotificationDto) {
    return this.userServiceClient
      .send({ cmd: 'send_notification' }, body)
      .pipe(catchError(this.catchError));
  }

  getNotifications(userId: number) {
    return this.userServiceClient
      .send({ cmd: 'get_notifications' }, userId)
      .pipe(catchError(this.catchError));
  }

  markNotificationRead(userId: number, notificationId: number) {
    return this.userServiceClient
      .send({ cmd: 'mark_notification_read' }, { userId, notificationId })
      .pipe(catchError(this.catchError));
  }
}
