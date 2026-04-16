import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

import type { AuthUser } from './auth-user.type';

type JwtPayload = {
  sub: string;
  email: string;
  fullName: string;
  roles: AuthUser['roles'];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request & { cookies?: Record<string, string> }) =>
          req?.cookies?.access_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'dev_secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload?.sub) throw new UnauthorizedException('توكن غير صالح');
    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      roles: payload.roles,
    };
  }
}
