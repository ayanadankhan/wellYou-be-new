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
  BadRequestException,
  Query
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
import { GetUserDto } from '../tenant/users/dto/get-user.dto';
import { UserRole } from '../tenant/users/schemas/user.schema';

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Step 1: Send OTP for login (replaces direct login)
   * Users must verify their identity with OTP before logging in
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    // First validate user credentials but don't log them in yet
    await this.authService.validateUsers(loginDto.email, loginDto.password);
    
    // Send OTP for verification
    const otpResult = await this.authService.sendLoginOtp(loginDto.email);
    
    return {
      email: loginDto.email,
      requiresOtp: true,
      ...otpResult,
      success: true
    };
  }

  @Public()
  @Post('login/app')
  @HttpCode(HttpStatus.OK)
  async loginApp(@Body() loginDto: LoginDto) {
    // First validate user credentials but don't log them in yet
    await this.authService.validateUsers(loginDto.email, loginDto.password);

    const otp : any = await this.authService.getLoginOtp(loginDto.email);
    
    return {
      email: loginDto.email,
      success: true,
      otp: otp.verification,
    };
  }

  /**
   * Register new user
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return this.authService.login(user);
  }

  /**
   * Alternative: Send OTP without password verification (for users who only have email)
   */
  @Public()
  @Post('send-login-otp')
  @HttpCode(HttpStatus.OK)
  async sendLoginOtp(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.sendLoginOtp(body.email);
  }

  /**
   * Step 2: Complete login with OTP verification
   * This generates the JWT token and handles attendance
   */
  @Public()
  @Post('verify-login-otp')
  @HttpCode(HttpStatus.OK)
  async verifyLoginOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    // This method validates OTP, generates JWT, and handles attendance
    return this.authService.loginWithOtp(verifyOtpDto);
  }

  /**
   * Initiate forgot password process
   */
  @Public()
  @Post('forgotPassword')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * Verify OTP for password reset
   */
  @Public()
  @Post('verifyOtp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(verifyOtpDto);
    console.log(result, "controller");
    
    if (!result.isValid) {
      throw new BadRequestException(result.message);
    }
    
    return { success: true, message: result.message };
  }

  /**
   * Reset password after OTP verification
   */
  @Public()
  @Post('resetPassword')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return result;
  }

  /**
   * Change user password (requires authentication)
   */
  @Patch('changePassword')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @User('_id') userId: string
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  /**
   * Logout user
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@User('_id') userId: string) {
    return this.authService.logout(userId);
  }

  /**
   * Get current user profile
   */
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
        permissions: user.permissions || [],
        tenantId: user.tenantId
      }
    };
  }

  /**
   * Find users with pagination (admin only)
   */
  @Get('users')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN) // Assuming you have role-based access
  async findUsers(@Query() getUserDto: GetUserDto) {
    return this.authService.findUsers(getUserDto);
  }
}