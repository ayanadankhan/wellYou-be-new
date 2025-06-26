// src/modules/auth/auth.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Get,
  Patch,
  Req,
  BadRequestException
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
import { ForgotPasswordDto } from './dto/forgotPasswordDto';
import { VerifyOtpDto } from './dto/verifyOtpDto';
import { ResetPasswordDto } from './dto/resetPasswordDto';

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

  @Patch('changePassword')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @User('_id') userId: string
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

@Public()
@Post('forgotPassword')
async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  return this.authService.forgotPassword(forgotPasswordDto);
}

@Public()
@Post('verifyOtp')
async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
  const result = await this.authService.verifyOtp(verifyOtpDto);
  console.log(result, "controler");
  
    if (!result.isValid) {
      throw new BadRequestException(result.message);
    }
    return { success: true, message: result.message };
}

@Public()
@Post('resetPassword')
async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
  const result = await this.authService.resetPassword(resetPasswordDto);
  if (!result.success) {
    throw new BadRequestException(result.message);
  }
  return result;
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