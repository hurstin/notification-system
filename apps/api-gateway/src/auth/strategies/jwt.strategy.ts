import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadDto } from '../dto/jwt-payload.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_key_123', // In a real app, use ConfigService
    });
  }
  // NEED TO BE FIXED 4
  validate(payload: JwtPayloadDto) {
    // This payload is the decoded JWT. What we return is attached to the Request as req.user
    return { userId: payload.sub, username: payload.username };
  }
}
