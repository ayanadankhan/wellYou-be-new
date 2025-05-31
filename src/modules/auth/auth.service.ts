
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/modules/tenant/users/user.service';
import * as bcrypt from 'bcrypt';
import { UserPayload } from './interfaces/auth.interface';
import { CreateUserDto } from '@/modules/tenant/users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      return null; // User not found
    }
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    // if (user && isPasswordValid) {
    //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
    //   const { password, ...result } = user.toObject(); // Exclude password from the result
    //   return result;
    // }
    return null; // Invalid password
  }

  async login(user: any) {
    const payload: UserPayload = {
      email: user.email,
      _id: user._id,
      role: user.role,
      // tenantId: user.tenantId, // Removed for MVP simplicity
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto): Promise<any> {
    const existingUser = await this.userService.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = await this.userService.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || 'employee', // Default to 'employee' if not specified
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const { password, ...result } = newUser.toObject(); // Exclude password from response
    // return result;
  }
}
