import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuthUserDto } from './auth/dto/auth-user.dto';
import { UpdateUserDto } from './auth/dto/update-user.dto';
import { UpdateNotificationPreferenceDto } from './auth/dto/update-notification-preference.dto';

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

  @UseGuards(JwtAuthGuard)
  @Get('notification-preferences')
  getNotificationPreferences(@Request() req: RequestWithUser) {
    return this.apiGatewayService.getNotificationPreferences(req.user.userId);
  }

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
}
