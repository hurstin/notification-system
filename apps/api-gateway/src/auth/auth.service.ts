import { Inject, Injectable, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { Redis } from 'ioredis';
import { AuthUserDto } from './dto/auth-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('USER_SERVICE') private client: ClientProxy, // Microservice TCP Client
    @Inject('REDIS_CLIENT') private redisClient: Redis, // Redis Client
  ) {}

  private catchError = (error: { message: string; status: number }) => {
    // Intercept the RPC Exception and re-throw as an HTTP Exception
    return throwError(
      () =>
        new HttpException(
          error.message || 'Internal server error',
          error.status || 500,
        ),
    );
  };

  // NEED TO BE FIXED 7
  async validateUser(email: string, pass: string): Promise<AuthUserDto | null> {
    try {
      console.log(`[API Gateway] Attempting to validate user: ${email}`);
      // NEED TO BE FIXED 8
      const user = await firstValueFrom<AuthUserDto & { password?: string }>(
        this.client.send({ cmd: 'verify_user_credentials' }, { email, pass }),
      );

      if (user) {
        // Explicitly return only the fields defined in AuthUserDto
        // TypeScript types don't filter properties at runtime.
        return {
          userId: user.userId,
          email: user.email,
        };
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
      user: user.email,
      access_token: this.jwtService.sign(payload),
    };
  }

  async logout(user: AuthUserDto, token?: string) {
    if (token) {
      // Decode token to get expiration
      const decodedRaw: unknown = this.jwtService.decode(token);
      const decoded = decodedRaw as { exp: number } | null;
      const expiry = decoded?.exp;
      const now = Math.floor(Date.now() / 1000);
      // TTL in seconds
      const ttl = expiry ? expiry - now : 3600; // Default 1 hour if exp not found

      if (ttl > 0) {
        // Store in Redis with TTL
        await this.redisClient.set(`blacklist_${token}`, 'true', 'EX', ttl);
      }
    }

    return {
      message: `${user.email} logged out successfully.`,
    };
  }

  register(createUserDto: CreateUserDto) {
    return this.client
      .send({ cmd: 'create_user' }, createUserDto)
      .pipe(catchError(this.catchError));
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

  resendVerificationEmail(user: AuthUserDto) {
    return this.client.send({ cmd: 'resend_verification_email' }, user).pipe(
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

  updatePassword(userId: number, body: UpdatePasswordDto) {
    return this.client.send({ cmd: 'update_password' }, { userId, body }).pipe(
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

  forgotPassword(email: string) {
    return this.client.send({ cmd: 'forgot_password' }, email).pipe(
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

  resetPassword(token: string, body: ResetPasswordDto) {
    return this.client.send({ cmd: 'reset_password' }, { token, body }).pipe(
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
