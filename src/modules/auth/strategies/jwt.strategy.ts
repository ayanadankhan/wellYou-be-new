import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPayload } from '../interfaces/auth.interface';
import { UserRole } from '@/modules/tenant/users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: UserPayload) {
    this.logger.debug(`JWT Payload received: ${JSON.stringify(payload)}`);

    const user = {
      firstName: payload.firstName,
      email: payload.email,
      role: payload.role,
    };

    this.logger.debug(`Returning user object: ${JSON.stringify(user)}`);
    return user;
  }
}
