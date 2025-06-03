// src/modules/auth/guards/jwt-auth.guard.ts
import { 
  Injectable, 
  ExecutionContext, 
  UnauthorizedException,
  Logger 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Public route accessed, skipping JWT validation');
      return true;
    }

    // For protected routes, proceed with JWT validation
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Log authentication attempts for debugging
    this.logger.debug(`JWT Auth attempt for: ${request.method} ${request.url}`);

    if (err) {
      this.logger.warn(`JWT Auth error: ${err.message}`);
      throw err;
    }

    if (!user) {
      const errorMessage = this.getErrorMessage(info);
      this.logger.warn(`JWT Auth failed: ${errorMessage}`);
      throw new UnauthorizedException(errorMessage);
    }

    this.logger.debug(`JWT Auth successful for user: ${user.email}`);
    return user;
  }

  private getErrorMessage(info: any): string {
    if (!info) {
      return 'Authentication required';
    }

    switch (info.name) {
      case 'TokenExpiredError':
        return 'Token has expired';
      case 'JsonWebTokenError':
        return 'Invalid token';
      case 'NotBeforeError':
        return 'Token not active';
      default:
        return info.message || 'Authentication failed';
    }
  }
}