import { Inject, Injectable, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { AuthUserDto } from './dto/auth-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('USER_SERVICE') private client: ClientProxy, // Microservice TCP Client
  ) {}
  // NEED TO BE FIXED 7
  async validateUser(email: string, pass: string): Promise<AuthUserDto | null> {
    try {
      console.log(`[API Gateway] Attempting to validate user: ${email}`);
      // NEED TO BE FIXED 8
      const user = await firstValueFrom<AuthUserDto & { password?: string }>(
        this.client.send({ cmd: 'verify_user_credentials' }, { email, pass }),
      );

      if (user) {
        // Strip out the password if it returned the full user
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (e) {
      console.error('[API Gateway] TCP Connection Error with user-service:', e);
      // In case the user-service is down or rejects the request
      return null;
    }
  }
  // NEED TO BE FIXED 9
  login(user: AuthUserDto) {
    const payload = { email: user.email, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  register(createUserDto: CreateUserDto) {
    return this.client.send({ cmd: 'create_user' }, createUserDto).pipe(
      catchError((error: { message: string; status: number }) => {
        // Intercept the RPC Exception and re-throw as an HTTP Exception
        return throwError(
          () =>
            new HttpException(
              error.message || 'Internal server error',
              error.status || 500,
            ),
        );
      }),
    );
  }

  verifyEmail(token: string) {
    return this.client.send({ cmd: 'verify_email' }, token).pipe(
      catchError((error: { message: string; status: number }) => {
        return throwError(
          () =>
            new HttpException(
              error.message || 'Internal server error',
              error.status || 500,
            ),
        );
      }),
    );
  }
}
