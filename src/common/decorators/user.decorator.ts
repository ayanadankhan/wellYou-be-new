// src/common/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';

export const User = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      return null;
    }

    // If no specific property is requested, return the entire user object
    if (!data) {
      return user;
    }

    // Return the specific property if it exists
    return user[data];
  },
);

// Alternative implementation with better type safety and validation
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      return null;
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);

// Specialized decorators for common use cases
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    
    if (!user || !user._id) {
      throw new Error('User ID not found in request.');
    }
    
    return user._id;
  },
);

export const UserEmail = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    
    if (!user || !user.email) {
      throw new Error('User email not found in request.');
    }
    
    return user.email;
  },
);

export const UserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    
    if (!user || !user.role) {
      throw new Error('User role not found in request.');
    }
    
    return user.role;
  },
);

// Usage examples:
/*
// In your controller:

@Controller('example')
export class ExampleController {
  
  // Get entire user object
  @Get('profile')
  getProfile(@User() user: AuthenticatedUser) {
    return user;
  }

  // Get specific user property
  @Get('user-id')
  getUserId(@User('_id') userId: string) {
    return { userId };
  }

  // Using specialized decorators
  @Get('email')
  getUserEmail(@UserEmail() email: string) {
    return { email };
  }

  @Get('role')
  getUserRole(@UserRole() role: string) {
    return { role };
  }

  // Using CurrentUser (with error handling)
  @Get('current')
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get('current-email')
  getCurrentUserEmail(@CurrentUser('email') email: string) {
    return { email };
  }
}
*/