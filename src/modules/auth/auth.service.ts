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

interface User {
  _id: string | { toString(): string }; // Accept string or ObjectId-like
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  // ... other properties
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
     @InjectModel('Employee') private readonly employeeModel: Model<Employee>,
  ) { }

  async validateUser(email: string, password: string): Promise<AuthenticatedUser> {
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

    // Handle attendance after successful validation
    await this.handleAttendanceOnLogin(authenticatedUser);

    return authenticatedUser;
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    this.logger.error(`Error validating user: ${error.message}`, error.stack);
    throw new InternalServerErrorException('Authentication failed');
  }
}

// Add this new private method to handle attendance
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

// Simplify the login method since attendance is now handled in validateUser
async login(user: AuthenticatedUser): Promise<LoginResponse> {
  this.logger.log(`Generating JWT for user: ${user.email}`);
  try {
    if (!user || !user.email || !user._id) {
      throw new UnauthorizedException('Invalid user data');
    }

    const expiresIn = this.configService.get<string>('JWT_EXPIRATION') || '24h';
    const accessToken = this.jwtService.sign(user, { expiresIn });

    this.logger.debug(`JWT generated successfully for user: ${user.email}`);
 console.log(user,"adanuser");
    return {
      access_token: accessToken,
     
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        permissions: user.permissions || []
      }
    ,
      
      expiresIn: this.parseExpirationTime(expiresIn),
    };
  } catch (error) {
    this.logger.error(`Error during login: ${error.message}`, error.stack);
    throw new InternalServerErrorException('Login failed');
  }
}

  // async validateUser(email: string, password: string): Promise<AuthenticatedUser> {
  //   try {
  //     this.logger.debug(`Validating user with email: ${email}`);

  //     if (!email || !password) {
  //       throw new UnauthorizedException('Email and password are required');
  //     }

  //     const user = await this.userService.findOneByEmail(email.toLowerCase().trim());
  //     if (!user) {
  //       this.logger.warn(`Login attempt with non-existent email: ${email}`);
  //       throw new UnauthorizedException('Invalid credentials');
  //     }

  //     const isPasswordValid = await this.validatePassword(password, user.password);
  //     if (!isPasswordValid) {
  //       this.logger.warn(`Invalid password attempt for user: ${email}`);
  //       throw new UnauthorizedException('Invalid credentials');
  //     }

  //     this.logger.debug(`User validated successfully: ${email}`);

  //     return {
  //       _id: (user as any)._id,
  //       email: user.email,
  //       role: user.role,
  //       firstName: user.firstName,
  //       lastName: user.lastName,
  //       permissions: user.permissions || [],
  //       tenantId: user.tenantId?.toString()
  //     };
  //   } catch (error) {
  //     if (error instanceof UnauthorizedException) {
  //       throw error;
  //     }
  //     this.logger.error(`Error validating user: ${error.message}`, error.stack);
  //     throw new InternalServerErrorException('Authentication failed');
  //   }
  // }

// async login(user: AuthenticatedUser): Promise<LoginResponse> {
//   try {
//     if (!user || !user.email || !user._id) {
//       throw new UnauthorizedException('Invalid user data');
//     }

//     const expiresIn = this.configService.get<string>('JWT_EXPIRATION') || '24h';
//     console.log(user);
    
//     const accessToken = this.jwtService.sign(user, { expiresIn });

//     this.logger.debug(`User logged in successfully: ${user.email}`);

//     return {
//       access_token: accessToken,
//       user: {
//         _id: user._id,
//         email: user.email,
//         role: user.role,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         permissions: user.permissions || [] // ✅ Add this line
//       },
//       expiresIn: this.parseExpirationTime(expiresIn),
//     };
//   } catch (error) {
//     this.logger.error(`Error during login: ${error.message}`, error.stack);
//     throw new InternalServerErrorException('Login failed');
//   }
// }


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
async changePassword(
  userId: string,
  changePasswordDto: ChangePasswordDto
): Promise<{ message: string }> {
  try {
    const { oldPassword, newPassword } = changePasswordDto;

    // 2. Prevent same password
    if (oldPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // 3. Fetch user
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 4. Check current password is correct
    const isValid = await this.validatePassword(oldPassword, user.password);
    if (!isValid) {
      this.logger.warn(`Invalid current password for user: ${user.email}`);
      throw new BadRequestException('Current password is incorrect');
    }

    // 5. Hash and update
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

  // Private helper methods
  async hashPassword(password: string): Promise<string> {
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
    throw error;
  }
}

async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
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