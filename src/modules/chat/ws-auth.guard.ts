import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { WsException } from '@nestjs/websockets'; // For WebSocket specific exceptions

/**
 * Custom WebSocket authentication guard using JWT.
 * This guard extracts the JWT token from the Socket.IO handshake auth,
 * verifies it, and attaches the user's ID to the socket for later use.
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const client: any = context.switchToWs().getClient();
    const token = client.handshake.auth.token;

    if (!token) {
      this.logger.warn(`WsAuthGuard: Authentication token missing for client ${client.id}`);
      throw new WsException('Unauthorized: No authentication token provided.');
    }

    try {
      const payload = this.jwtService.verify(token);
      // Assuming your JWT payload has a 'sub' field for user ID
      client.handshake.auth.userId = payload.sub; // Attach user ID to the socket's handshake auth
      this.logger.debug(`WsAuthGuard: Client ${client.id} authenticated successfully. User ID: ${payload.sub}`);
      return true;
    } catch (error) {
      this.logger.error(`WsAuthGuard: Token verification failed for client ${client.id}: ${error.message}`);
      throw new WsException('Unauthorized: Invalid authentication token.');
    }
  }
}
