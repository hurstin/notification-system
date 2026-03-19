import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Body,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUserDto } from './dto/auth-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// NEED TO BE FIXED 3
interface RequestWithUser {
  user: AuthUserDto;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  // NEED TO BE FIXED 1
  login(@Request() req: RequestWithUser) {
    // When LocalAuthGuard passes, req.user holds the user object returned by AuthService.validateUser
    return this.authService.login(req.user);
  }

  // Example Protected Route
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  // NEED TO BE FIXED 2
  getProfile(@Request() req: RequestWithUser) {
    // req.user contains the decoded JWT payload
    return req.user;
  }

  // verify email
  @Get('verify')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // update password
  @UseGuards(JwtAuthGuard)
  @Patch('update-password')
  updatePassword(
    @Request() req: RequestWithUser,
    @Body() body: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(req.user.userId, body);
  }

  // forgot password
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  // reset password
  @Patch('reset-password/:token')
  resetPassword(@Param('token') token: string, @Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(token, body);
  }
}
