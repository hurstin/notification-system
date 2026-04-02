import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuthUserDto } from './auth/dto/auth-user.dto';
import { UpdateUserDto } from './auth/dto/update-user.dto';
import { UpdateNotificationPreferenceDto } from './auth/dto/update-notification-preference.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { RegisterDeviceTokenDto } from './dto/device-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

interface RequestWithUser {
  user: AuthUserDto;
}

@Controller('users')
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  //  update user profile
  @UseGuards(JwtAuthGuard)
  @Patch('update-profile')
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateProfileDto: UpdateUserDto,
  ) {
    return this.apiGatewayService.updateProfile(req.user, updateProfileDto);
  }

  // delete user
  @UseGuards(JwtAuthGuard)
  @Delete('delete-me')
  deleteMe(@Request() req: RequestWithUser) {
    return this.apiGatewayService.deleteMe(req.user);
  }

  // get user profile
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getUserProfile(@Request() req: RequestWithUser) {
    return this.apiGatewayService.getUserProfile(req.user);
  }

  // get all users
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllUsers() {
    return this.apiGatewayService.getAllUsers();
  }

  // NOTIFICATION PREFERENCE

  // get notification preferences
  @UseGuards(JwtAuthGuard)
  @Get('notification-preferences')
  getNotificationPreferences(@Request() req: RequestWithUser) {
    return this.apiGatewayService.getNotificationPreferences(req.user.userId);
  }

  // update notification preferences
  @UseGuards(JwtAuthGuard)
  @Patch('notification-preferences')
  updateNotificationPreferences(
    @Request() req: RequestWithUser,
    @Body() body: UpdateNotificationPreferenceDto,
  ) {
    return this.apiGatewayService.updateNotificationPreferences(
      req.user.userId,
      body,
    );
  }

  // Template Management Endpoints

  // list templates
  @UseGuards(JwtAuthGuard)
  @Get('templates')
  listTemplates() {
    return this.apiGatewayService.listTemplates();
  }

  // render template
  @UseGuards(JwtAuthGuard)
  @Get('templates/render')
  getTemplate(
    @Query('name') name: string,
    @Query('lang') lang?: string,
    @Body() variables?: Record<string, unknown>,
  ) {
    return this.apiGatewayService.getTemplate(name, lang, variables);
  }

  // create template
  @UseGuards(JwtAuthGuard)
  @Post('templates')
  createTemplate(@Body() data: CreateTemplateDto) {
    return this.apiGatewayService.createTemplate(data);
  }

  // update template
  @UseGuards(JwtAuthGuard)
  @Patch('templates/:name')
  updateTemplate(@Param('name') name: string, @Body() data: any) {
    return this.apiGatewayService.updateTemplate(name, data);
  }

  // delete template
  @UseGuards(JwtAuthGuard)
  @Delete('templates/:name')
  deleteTemplate(@Param('name') name: string) {
    return this.apiGatewayService.deleteTemplate(name);
  }

  // Device Token Management Endpoints

  // register device token
  @UseGuards(JwtAuthGuard)
  @Post('devices')
  registerDeviceToken(
    @Request() req: RequestWithUser,
    @Body() body: RegisterDeviceTokenDto,
  ) {
    return this.apiGatewayService.registerDeviceToken(req.user.userId, body);
  }

  // unregister device token
  @UseGuards(JwtAuthGuard)
  @Delete('devices/:token')
  deleteDeviceToken(
    @Request() req: RequestWithUser,
    @Param('token') token: string,
  ) {
    return this.apiGatewayService.deleteDeviceToken(req.user.userId, token);
  }

  // Notification Triggering and History Endpoints

  // trigger a notification
  @UseGuards(JwtAuthGuard)
  @Post('notifications/send')
  sendNotification(
    @Request() req: RequestWithUser, // Optional based on use case, could be system-to-system
    @Body() body: SendNotificationDto,
  ) {
    return this.apiGatewayService.sendNotification(body);
  }

  // fetch notification history
  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  getNotifications(@Request() req: RequestWithUser) {
    return this.apiGatewayService.getNotifications(req.user.userId);
  }

  // mark notification as read
  @UseGuards(JwtAuthGuard)
  @Patch('notifications/:id/read')
  markNotificationRead(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.apiGatewayService.markNotificationRead(
      req.user.userId,
      parseInt(id, 10),
    );
  }
}
