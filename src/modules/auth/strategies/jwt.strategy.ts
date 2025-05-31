
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPayload } from '../interfaces/auth.interface';
// import { Types } from 'mongoose'; // Removed for MVP simplicity
import { UserRole } from '@/modules/tenant/users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: UserPayload) {
    // This payload comes from the token signed by JwtService
    // Return the user object that will be attached to req.user
    return {
      _id: payload._id, // Changed from Types.ObjectId to string
      email: payload.email,
      role: payload.role,
      // tenantId: payload.tenantId ? new Types.ObjectId(payload.tenantId) : undefined, // Removed for MVP simplicity
    };
  }
}
