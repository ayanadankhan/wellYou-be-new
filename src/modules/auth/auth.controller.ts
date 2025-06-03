// src/modules/auth/auth.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Get,
  Patch
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/registerDto';
import { ChangePasswordDto } from './dto/changePasswordDto';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthenticatedUser } from './interfaces/auth.interface';
import { User } from '@/common/decorators/user.decorator';

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    return this.authService.login(user);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return this.authService.login(user);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @User('_id') userId: string
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@User('_id') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@User() user: AuthenticatedUser) {
    return {
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    };
  }
}