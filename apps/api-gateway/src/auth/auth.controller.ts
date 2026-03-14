import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUserDto } from './dto/auth-user.dto';

// NEED TO BE FIXED 3
interface RequestWithUser {
  user: AuthUserDto;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
