// src/modules/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for accessing a route
 * @param roles - Array of role names that are allowed to access the route
 * @example
 * ```typescript
 * @Get('admin-only')
 * @Roles('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * adminOnlyRoute() {
 *   return 'Only admins can see this';
 * }
 * 
 * @Get('admin-or-manager')
 * @Roles('admin', 'manager')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * adminOrManagerRoute() {
 *   return 'Admins and managers can see this';
 * }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Predefined role constants for better type safety
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  USER: 'user',
} as const;

// Type for roles
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Convenience decorators for common role combinations
export const AdminOnly = () => Roles(USER_ROLES.ADMIN);
export const ManagerOnly = () => Roles(USER_ROLES.MANAGER);
export const AdminOrManager = () => Roles(USER_ROLES.ADMIN, USER_ROLES.MANAGER);
export const EmployeeOrAbove = () => Roles(USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE);