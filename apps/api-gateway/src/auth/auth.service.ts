import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('USER_SERVICE') private client: ClientProxy, // Microservice TCP Client
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    try {
      console.log(`[API Gateway] Attempting to validate user: ${username}`);
      const user = await firstValueFrom(
        this.client.send({ cmd: 'verify_user_credentials' }, { username, pass }),
      );
      
      console.log(`[API Gateway] Received response from user-service:`, user);
      
      if (user) {
        // Strip out the password if it returned the full user
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

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId || user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
