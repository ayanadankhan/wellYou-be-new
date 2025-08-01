import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpStatus, HttpCode, Req, HttpException, Query } from '@nestjs/common';
import { ParseObjectIdPipe } from '@/common/pipes/parse-object-id.pipe';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Public } from '@/common/decorators/public.decorator';
// import { Roles } from '@/common/decorators/roles.decorator';
import { User, UserRole } from './schemas/user.schema'; // Import UserRole from its schema
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { GetUserDto } from './dto/get-user.dto';


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
export class UserController {constructor(private readonly userService: UserService) {}

@Post()
async create( @CurrentUser() user: User, @Body() createUserDto: CreateUserDto) {
  if (!user) {
    throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
  }
  if (user.role !== UserRole.SUPER_ADMIN) {
    createUserDto.tenantId = user.tenantId?.toString();
  }
  return this.userService.create(createUserDto, user);
}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll(@CurrentUser() user: User,@Query() getUserDto: GetUserDto) {
    if (user.role === UserRole.SUPER_ADMIN) {
      getUserDto.role = UserRole.COMPANY_ADMIN; // Super Admin can see all users
      return this.userService.findAll(getUserDto); // Super Admin sees all users
    } else if (user.tenantId) { // Use tenantId if available, fallback to _id for simplicity
      const tenantId = user.tenantId.toString();
      return this.userService.findAllByTenant(tenantId, getUserDto); // Tenant-specific users
    }
    return []; // Should not reach here if user is authenticated
  }

  @Get(':id')
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get user by ID' })
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
  update(  @CurrentUser() user: User,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Validate user authentication
    if (!req.user) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

      return this.userService.update(id, updateUserDto, user);
  
  }

  @Delete(':id')
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) // Super Admin or Tenant Admin can delete users
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID' })
  remove(
    @CurrentUser() user: any,
    @Param('id', ParseObjectIdPipe) id: string, 
    @Req() req: AuthenticatedRequest
  ) {
    // Validate user authentication
    if (!req.user) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.userService.remove(id, user);
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