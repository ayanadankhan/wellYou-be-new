// src/modules/auth/guards/index.ts
export { JwtAuthGuard } from './jwt-auth.gaurd';
export { RolesGuard } from './roles.guard';


// Usage examples and documentation
/*
=== USAGE EXAMPLES ===

1. JWT Authentication (Required):
```typescript
@Controller('protected')
export class ProtectedController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@User() user: AuthenticatedUser) {
    return user;
  }
}
```

2. Role-Based Access Control:
```typescript
@Controller('admin')
export class AdminController {
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAllUsers() {
    return 'Admin only content';
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)  
  @AdminOrManager() // Using convenience decorator
  getReports() {
    return 'Admin or manager content';
  }
}
```

3. Optional Authentication:
```typescript
@Controller('public')
export class PublicController {
  @Get('content')
  @UseGuards(OptionalJwtAuthGuard)
  getContent(@User() user?: AuthenticatedUser) {
    if (user) {
      return `Hello ${user.firstName}, personalized content`;
    }
    return 'Public content for everyone';
  }
}
```

4. Public Routes (No Authentication):
```typescript
@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    // Public route - no JWT required
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    // Public route - no JWT required
  }
}
```

5. Global Guard Setup (in main module):
```typescript
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // All routes protected by default
    },
  ],
})
export class AppModule {}
```

=== GUARD HIERARCHY ===
1. JwtAuthGuard - Validates JWT token and loads user
2. RolesGuard - Checks if user has required roles
3. OptionalJwtAuthGuard - Loads user if token present, allows null

=== DECORATOR HIERARCHY ===
1. @Public() - Skip all authentication
2. @Roles('role1', 'role2') - Require specific roles
3. @AdminOnly() - Convenience for admin role
4. @ManagerOnly() - Convenience for manager role
5. @AdminOrManager() - Convenience for admin or manager
6. @EmployeeOrAbove() - Convenience for employee, manager, or admin
*/