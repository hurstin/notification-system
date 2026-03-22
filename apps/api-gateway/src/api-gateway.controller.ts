import { Body, Controller, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuthUserDto } from './auth/dto/auth-user.dto';
import { UpdateUserDto } from './auth/dto/update-user.dto';

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

  // get user profile

  // get all users
}
