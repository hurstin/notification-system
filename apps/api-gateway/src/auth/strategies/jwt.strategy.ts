import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Redis } from 'ioredis';
import { JwtPayloadDto } from '../dto/jwt-payload.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject('REDIS_CLIENT') private redisClient: Redis) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_key_123', // In a real app, use ConfigService
      passReqToCallback: true,
    });
  }
  // NEED TO BE FIXED 4
  async validate(req: Request, payload: JwtPayloadDto) {
    // Extract token from request header
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : undefined;

    if (token) {
      // Check if token is blacklisted in Redis
      const isBlacklisted = await this.redisClient.get(`blacklist_${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // This payload is the decoded JWT. What we return is attached to the Request as req.user
    return { userId: payload.sub, email: payload.email };
  }
}
