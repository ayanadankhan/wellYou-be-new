// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  InternalServerErrorException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@/modules/tenant/users/user.service';
import * as bcrypt from 'bcrypt';
import { UserPayload, LoginResponse, AuthenticatedUser } from './interfaces/auth.interface';
import { RegisterDto } from './dto/registerDto';
import { ChangePasswordDto } from './dto/changePasswordDto';
import { AttendanceService } from '../attendance/attendance.service';
import { Model } from 'mongoose';
import { Employee } from '../employees/schemas/Employee.schema';
import { InjectModel } from '@nestjs/mongoose';
import { GetUserDto } from '../tenant/users/dto/get-user.dto';
import { ForgotPasswordDto } from './dto/forgotPasswordDto';
import { ForgotPassword } from '../auth/schemas/forgotPassword.schema';
import { VerifyOtpDto } from './dto/verifyOtpDto';
import { ResetPasswordDto } from './dto/resetPasswordDto';
import { MailService } from '../mail/mail.service';

interface User {
  _id: string | { toString(): string }; // Accept string or ObjectId-like
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  permissions?: string[];
  tenantId?: string | { toString(): string };
  // ... other properties
  // Ensure _id is present for mongoose documents
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly attendanceService: AttendanceService,
    private readonly mailService: MailService,
    @InjectModel('Employee') private readonly employeeModel: Model<Employee>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel(ForgotPassword.name) private readonly forgotPasswordModel: Model<ForgotPassword>
  ) { }

  /**
   * Validates user credentials with email and password
   */
  async validateUsers(email: string, password: string): Promise<AuthenticatedUser> {
    try {
      this.logger.debug(`Validating user with email: ${email}`);

      if (!email || !password) {
        throw new UnauthorizedException('Email and password are required');
      }

      const user = await this.userService.findOneByEmail(email.toLowerCase().trim());
      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await this.validatePassword(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for user: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.debug(`User validated successfully: ${email}`);

      // Create authenticated user object
      const authenticatedUser: AuthenticatedUser = {
        _id: (user as any)._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        permissions: user.permissions || [],
        tenantId: user.tenantId?.toString()
      };

      return authenticatedUser;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Authentication failed');
    }
  }

  /**
   * Handles attendance check-in on successful login
   */
  private async handleAttendanceOnLogin(user: AuthenticatedUser): Promise<void> {
    try {
      this.logger.log(`Checking attendance for user: ${user.email}`);
      
      // Get employee ID from employees collection using user ID
      const employee = await this.employeeModel.findOne({ userId: user._id }).exec();
      this.logger.log(`Employee found for user ${user._id}: ${employee ? employee._id : 'None'}`);
      
      if (employee && employee._id) {
        try {
          // Trigger auto check-in for the employee
          await this.attendanceService.checkin(employee._id.toString());
          this.logger.log(`Auto check-in successful for employee: ${employee._id}`);
        } catch (checkinError) {
          // Log the error but don't fail the login process
          this.logger.warn(`Auto check-in failed for employee ${employee._id}: ${checkinError.message}`);
          // Don't throw the error - attendance failure shouldn't prevent login
        }
      } else {
        this.logger.warn(`No employee record found for user: ${user._id}`);
      }
    } catch (error) {
      // Log attendance handling errors but don't fail the authentication
      this.logger.error(`Error handling attendance for user ${user._id}: ${error.message}`);
      // Don't throw - attendance errors shouldn't prevent successful login
    }
  }

  /**
   * Generates JWT token and login response
   */
  async login(user: AuthenticatedUser): Promise<LoginResponse> {
    this.logger.log(`Generating JWT for user: ${user.email}`);
    try {
      if (!user || !user.email || !user._id) {
        throw new UnauthorizedException('Invalid user data');
      }

      const expiresIn = this.configService.get<string>('JWT_EXPIRATION') || '24h';
      const accessToken = this.jwtService.sign(user, { expiresIn });

      this.logger.debug(`JWT generated successfully for user: ${user.email}`);
      console.log(user, "adanuser");
      
      return {
        access_token: accessToken,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          permissions: user.permissions || []
        },
        expiresIn: this.parseExpirationTime(expiresIn),
      };
    } catch (error) {
      this.logger.error(`Error during login: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Login failed');
    }
  }

  /**
   * Registers a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthenticatedUser> {
    try {
      const { email, password, firstName, lastName, role } = registerDto;

      // Add debugging here
      console.log('=== Registration Debug ===');
      console.log('Original password from DTO:', `"${password}"`);
      console.log('Password length:', password.length);
      console.log('Password bytes:', Buffer.from(password).toString('hex'));

      // Check if user already exists
      const existingUser = await this.userService.findOneByEmail(email.toLowerCase().trim());
      if (existingUser) {
        this.logger.warn(`Registration attempt with existing email: ${email}`);
        throw new ConflictException('User with this email already exists');
      }

      // Hash password with debugging
      console.log('About to hash password...');
      const hashedPassword = await this.hashPassword(password);
      console.log('Hashed password result:', hashedPassword);
      
      // Test the hash immediately after creation
      const testHash = await bcrypt.compare(password, hashedPassword);
      console.log('Immediate hash test (should be true):', testHash);
      console.log('=== End Registration Debug ===');

      // Create user
      const newUser = await this.userService.create({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role || 'employee',
      });

      this.logger.debug(`User registered successfully: ${email}`);

      return {
        _id: (newUser as any)._id.toString(),
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error during registration: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  /**
   * Changes user password
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    try {
      const { oldPassword, newPassword } = changePasswordDto;

      // Prevent same password
      if (oldPassword === newPassword) {
        throw new BadRequestException('New password must be different from current password');
      }

      // Fetch user
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check current password is correct
      const isValid = await this.validatePassword(oldPassword, user.password);
      if (!isValid) {
        this.logger.warn(`Invalid current password for user: ${user.email}`);
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash and update
      const hashed = await this.hashPassword(newPassword);
      await this.userService.update(userId, { password: hashed });

      this.logger.debug(`Password updated successfully for user: ${user.email}`);
      return { message: 'Password changed successfully' };

    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to change password: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Password change failed');
    }
  }

  /**
   * Finds users with pagination
   */
  async findUsers(getUserDto: GetUserDto) {
    const where: Record<string, any> = {};

    if (getUserDto.email) {
      where.email = { $regex: getUserDto.email, $options: 'i' };
    }

    const skip = getUserDto.o ? Number(getUserDto.o) : 0;
    const limit = getUserDto.l ? Number(getUserDto.l) : 10;

    return this.userModel.aggregate([
      { $match: where },
      {
        $project: { 
          verification: 0, 
          password: 0, 
          verificationExpires: 0, 
          config: 0 
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);
  }

  /**
   * Initiates forgot password process by sending OTP
   */
  async forgotPassword(createForgotPasswordDto: ForgotPasswordDto, isForLogin = false) {
    try {
      const user = await this.userModel.findOne({ 
        email: createForgotPasswordDto.email.toLowerCase().trim() 
      }).exec();

      if (!user) {
        return {
          email: createForgotPasswordDto.email,
          success: true,
          message: 'If the email exists in our system, you will receive a password reset link'
        };
      }

      const pin = Math.floor(1000 + Math.random() * 9000);
      await this.forgotPasswordModel.create({
        email: createForgotPasswordDto.email,
        verification: pin,
        isForLogin,
        userId: user._id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiration
      });

      // Send OTP via email
      await this.mailService.sendOtpEmail(createForgotPasswordDto.email, `${pin}`);

      return {
        email: createForgotPasswordDto.email,
        success: true,
        message: 'Password reset OTP sent to your email'
      };
    } catch (error) {
      this.logger.error(`Forgot password error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process forgot password request');
    }
  }

  /**
   * Sends OTP for login authentication
   */
  async sendLoginOtp(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const trimmedEmail = email.toLowerCase().trim();
      
      // Validate email format
      if (!this.isValidEmail(trimmedEmail)) {
        throw new BadRequestException('Invalid email format');
      }

      const user: any = await this.userService.findOneByEmail(trimmedEmail);
      
      if (!user) {
        // Return success to prevent email enumeration attacks
        this.logger.warn(`Login OTP requested for non-existent email: ${trimmedEmail}`);
        return {
          success: true,
          message: 'If the email exists in our system, you will receive an OTP'
        };
      }

      // Clean up any existing unused OTPs for this email and login purpose
      await this.forgotPasswordModel.deleteMany({
        email: trimmedEmail,
        isForLogin: true,
        isUsed: false
      });

      // Generate 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000);
      
      // Create OTP record
      await this.forgotPasswordModel.create({
        email: trimmedEmail,
        verification: otp,
        isForLogin: true,
        userId: (user as any)._id ?? (user as any).id,
        isUsed: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry for login
      });

      const employee = await this.employeeModel.findOne({ userId: user._id }).exec();

      const recipientEmail = (
        ['super_admin', 'company_admin'].includes(user.role) || 
        employee?.employmentType === 'REMOTE'
      ) 
        ? trimmedEmail 
        : 'teambitsbuffer@gmail.com';

      await this.mailService.sendOtpEmail(recipientEmail, `${otp} for ${trimmedEmail}`);

      this.logger.log(`Login OTP sent successfully to: ${recipientEmail}`);
      
      return {
        success: true,
        message: 'OTP sent to your email address'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Login OTP sending error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to send login OTP');
    }
  }

  async getLoginOtp(email: string) {
    try {
      const trimmedEmail = email.toLowerCase().trim();
      
      // Validate email format
      if (!this.isValidEmail(trimmedEmail)) {
        throw new BadRequestException('Invalid email format');
      }

      const user: any = await this.userService.findOneByEmail(trimmedEmail);
      
      if (!user) {
        // Return success to prevent email enumeration attacks
        this.logger.warn(`Login OTP requested for non-existent email: ${trimmedEmail}`);
        return {
          success: true,
          message: 'If the email exists in our system, you will receive an OTP'
        };
      }
      const otp = await this.forgotPasswordModel
        .findOne({ email: trimmedEmail })
        .sort({ createdAt: -1 })
        .exec();
      
      return otp
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Login OTP sending error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to send login OTP');
    }
  }

  /**
   * Authenticates user with OTP and returns login response
   */
  async loginWithOtp(verifyOtpDto: VerifyOtpDto): Promise<LoginResponse> {
    try {
      const { email, otp } = verifyOtpDto;
      const trimmedEmail = email.toLowerCase().trim();

      // Validate input
      if (!trimmedEmail || !otp) {
        throw new BadRequestException('Email and OTP are required');
      }

      if (!/^\d{4}$/.test(otp.toString())) {
        throw new BadRequestException('OTP must be a 4-digit number');
      }

      // Find and validate OTP
      const otpRecord = await this.forgotPasswordModel.findOne({
        email: trimmedEmail,
        verification: parseInt(otp.toString()),
        isForLogin: true,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        this.logger.warn(`Invalid or expired OTP attempt for email: ${trimmedEmail}`);
        throw new UnauthorizedException('Invalid OTP or OTP has expired');
      }

      // Mark OTP as used
      await this.forgotPasswordModel.findByIdAndUpdate(otpRecord._id, {
        isUsed: true,
        updatedAt: new Date()
      });

      // Get user details
      const user = await this.userService.findOneByEmail(trimmedEmail);
      if (!user) {
        this.logger.error(`User not found for verified OTP: ${trimmedEmail}`);
        throw new UnauthorizedException('User not found');
      }

      // Create authenticated user object
      const authenticatedUser: AuthenticatedUser = {
        _id: (user as any)._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        permissions: user.permissions || [],
        tenantId: user.tenantId?.toString()
      };

      // Handle attendance after successful OTP login
      await this.handleAttendanceOnLogin(authenticatedUser);

      this.logger.log(`User successfully logged in with OTP: ${trimmedEmail}`);

      // Generate and return login response
      return this.login(authenticatedUser);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`OTP login error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('OTP login failed');
    }
  }

  /**
   * Verifies OTP for password reset
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ isValid: boolean; message: string }> {
    try {
      const { email, otp } = verifyOtpDto;
      const trimmedEmail = email.toLowerCase().trim();

      if (!trimmedEmail || !otp) {
        throw new BadRequestException('Email and OTP are required');
      }

      const otpRecord = await this.forgotPasswordModel.findOne({
        email: trimmedEmail,
        verification: parseInt(otp.toString()),
        isForLogin: false, // For password reset only
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        this.logger.warn(`Invalid OTP verification attempt for: ${trimmedEmail}`);
        return {
          isValid: false,
          message: 'Invalid OTP or OTP has expired'
        };
      }

      const user = await this.userModel.findById(otpRecord.userId);
      if (!user) {
        return {
          isValid: false,
          message: 'User not found'
        };
      }

      // Mark OTP as used
      await this.forgotPasswordModel.findByIdAndUpdate(otpRecord._id, {
        isUsed: true,
        updatedAt: new Date()
      });

      this.logger.log(`OTP verified successfully for: ${trimmedEmail}`);
      
      return {
        isValid: true,
        message: 'OTP verified successfully'
      };
      
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`OTP verification error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('OTP verification failed');
    }
  }

  /**
   * Resets user password after OTP verification
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { email, password } = resetPasswordDto;
      const trimmedEmail = email.toLowerCase().trim();

      if (!trimmedEmail || !password) {
        throw new BadRequestException('Email and password are required');
      }

      // Find user
      const user = await this.userModel.findOne({ email: trimmedEmail });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Hash and update password
      const hashedPassword = await this.hashPassword(password);
      await this.userModel.updateOne({ _id: user._id }, { password: hashedPassword });

      // Invalidate all OTPs for this email
      await this.forgotPasswordModel.updateMany(
        { email: trimmedEmail },
        { isUsed: true, updatedAt: new Date() }
      );

      this.logger.log(`Password reset successfully for: ${trimmedEmail}`);

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Password reset error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Password reset failed');
    }
  }

  /**
   * Logs out user
   */
  async logout(userId: string): Promise<{ message: string }> {
    try {
      // In a production app, you might want to blacklist the token
      // or store active sessions in Redis for better control
      this.logger.debug(`User logged out: ${userId}`);
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error(`Error during logout: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Logout failed');
    }
  }

  /**
   * Validates user credentials (for backward compatibility)
   */
  async validateUser(email: string, password?: string): Promise<AuthenticatedUser> {
    try {
      this.logger.debug(`Validating user with email: ${email}`);

      if (!email) {
        throw new UnauthorizedException('Email is required');
      }

      const user = await this.userService.findOneByEmail(email.toLowerCase().trim());
      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // If password is provided, validate it
      if (password) {
        const isPasswordValid = await this.validatePassword(password, user.password);
        if (!isPasswordValid) {
          this.logger.warn(`Invalid password attempt for user: ${email}`);
          throw new UnauthorizedException('Invalid credentials');
        }
      }

      this.logger.debug(`User validated successfully: ${email}`);

      return {
        _id: (user as any)._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        permissions: user.permissions || [],
        tenantId: user.tenantId?.toString()
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Authentication failed');
    }
  }

  // Private helper methods

  /**
   * Hashes password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      console.log('=== Hash Password Debug ===');
      console.log('Input to hashPassword:', `"${password}"`);
      console.log('Input length:', password.length);
      
      const saltRounds = 10;
      console.log('Salt rounds:', saltRounds);
      
      const hash = await bcrypt.hash(password, saltRounds);
      console.log('Generated hash:', hash);
      console.log('Hash length:', hash.length);
      console.log('=== End Hash Password Debug ===');
      
      return hash;
    } catch (error) {
      console.error('Error in hashPassword:', error);
      this.logger.error(`Password hashing failed: ${error.message}`);
      throw new InternalServerErrorException('Password processing failed');
    }
  }

  /**
   * Validates password against hash
   */
  private async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      // Add detailed debugging
      console.log('=== Password Validation Debug ===');
      console.log('Plain password:', `"${plainPassword}"`);
      console.log('Plain password length:', plainPassword.length);
      console.log('Plain password bytes:', Buffer.from(plainPassword).toString('hex'));
      console.log('Hashed password:', hashedPassword);
      console.log('Hash length:', hashedPassword.length);
      console.log('Hash starts with $2b$:', hashedPassword.startsWith('$2b$'));
      
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      console.log('Bcrypt compare result:', isValid);
      console.log('=== End Debug ===');
      
      return isValid;
    } catch (error) {
      this.logger.error('Error comparing passwords:', error);
      console.log('Bcrypt error:', error);
      return false;
    }
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Parses JWT expiration time to seconds
   */
  private parseExpirationTime(expiration: string): number {
    // Convert JWT expiration string to seconds
    const timeMap: { [key: string]: number } = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
    };

    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 86400; // Default 24 hours

    const [, time, unit] = match;
    return parseInt(time) * (timeMap[unit] || 86400);
  }
}