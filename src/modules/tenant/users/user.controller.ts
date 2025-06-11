import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpStatus, HttpCode, Req, HttpException } from '@nestjs/common';
import { ParseObjectIdPipe } from '@/common/pipes/parse-object-id.pipe';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Public } from '@/common/decorators/public.decorator';
// import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema'; // Import UserRole from its schema
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

// Define the authenticated user interface
interface AuthenticatedUser {
  _id: string;
  role: UserRole;
  tenantId?: string;
  // Add other properties as needed
}

// Extend the Express Request interface
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
@Public()
  @Post()
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) 
  // Super Admin or Tenant Admin can create users
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createUserDto: CreateUserDto, @Req() req: AuthenticatedRequest) {
    // Validate user authentication
    // if (!req.user) {
    //   throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    // }

    // // For MVP, simplify tenantId logic. Super admin can create any user.
    // // Tenant admin can only create users within their own tenant.
    // if (req.user.role === UserRole.ADMIN && !createUserDto.tenantId) {
    //   createUserDto.tenantId = req.user.tenantId || req.user._id; // Use tenantId if available, fallback to _id for simplicity
    // }
    return this.userService.create(createUserDto);
  }
@Public()
  @Get()
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll(@Req() req: AuthenticatedRequest) {
    // // Validate user authentication
    // if (!req.user) {
    //   throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    // }

    // // For MVP, simplify tenant-based filtering
    // if (req.user.role === UserRole.SUPER_ADMIN) {
      return this.userService.findAll(); // Super Admin sees all users
    // } else if (req.user.tenantId || req.user._id) { // Use tenantId if available, fallback to _id for simplicity
    //   const tenantId = req.user.tenantId || req.user._id;
    //   return this.userService.findAllByTenant(tenantId); // Tenant-specific users
    // }
    // return []; // Should not reach here if user is authenticated
  }

  @Get(':id')
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Return the user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Param('id', ParseObjectIdPipe) id: string, @Req() req: AuthenticatedRequest) {
    // Validate user authentication
    if (!req.user) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      return this.userService.findById(id);
    } else if (req.user.tenantId || req.user._id) {
      // Users can only view users within their own tenant
      const tenantId = req.user.tenantId || req.user._id;
      return this.userService.findByIdAndTenant(id, tenantId);
    }
    throw new HttpException('Access forbidden', HttpStatus.FORBIDDEN);
  }

  @Patch(':id')
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) // Super Admin or Tenant Admin can update users
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'The user has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Validate user authentication
    if (!req.user) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      return this.userService.update(id, updateUserDto);
    } else if (req.user.tenantId || req.user._id) {
      // Admins can only update users within their own tenant
      const tenantId = req.user.tenantId || req.user._id;
      return this.userService.updateByTenant(id, tenantId, updateUserDto);
    }
    throw new HttpException('Access forbidden', HttpStatus.FORBIDDEN);
  }

  @Delete(':id')
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) // Super Admin or Tenant Admin can delete users
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 204, description: 'The user has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id', ParseObjectIdPipe) id: string, @Req() req: AuthenticatedRequest) {
    // Validate user authentication
    if (!req.user) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      return this.userService.remove(id);
    } else if (req.user.tenantId || req.user._id) {
      // Admins can only delete users within their own tenant
      const tenantId = req.user.tenantId || req.user._id;
      return this.userService.removeByTenant(id, tenantId);
    }
    throw new HttpException('Access forbidden', HttpStatus.FORBIDDEN);
  }

  @Get('profile')
@Public()
getCurrentUser(@Req() req: AuthenticatedRequest) {
  console.log('Current user from JWT:', req.user);
  return {
    user: req.user,
    message: 'Current user info'
  };
}}