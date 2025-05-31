
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { CreateUserDto } from '@/modules/tenant/users/dto/create-user.dto'; // Import for registration

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict (email already exists).' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  // @Public()
  // @Post('login')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'User login' })
  // @ApiResponse({ status: 200, description: 'User successfully logged in and token issued.' })
  // @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  // async login(@Body() loginDto: LoginDto) {
  //   const user = await this.authService.validateUser(loginDto.email, loginDto.password);
  //   // if (!user) {
  //   //   throw new UnauthorizedException('Invalid credentials');
  //   // }
  //   return this.authService.login(user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(AuthGuard('jwt'))
  // @Get('profile')
  // @ApiOperation({ summary: 'Get user profile (requires authentication)' })
  // @ApiResponse({ status: 200, description: 'User profile data.' })
  // @ApiResponse({ status: 401, description: 'Unauthorized.' })
  // getProfile(@Request() req) {
  //   // The user object is attached to the request by the JwtStrategy
  //   return req.user;
  // }
}
