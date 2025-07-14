
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../../mail/mail.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      if (createUserDto.tenantId && typeof createUserDto.tenantId === 'string') {
        createUserDto.tenantId = new Types.ObjectId(createUserDto.tenantId) as any;
      }

      const originalPassword = createUserDto.password;
      const user = await this.userModel.create(createUserDto);

      if (user.email) {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
        await this.mailService.sendWelcomeEmail(
          user.email,
          fullName,
          user.email,
          originalPassword
        );
      }
      
      await this.auditService.log(
        'users',
        'create',
        user._id.toString(),
        user,
        null 
      );

      return user;
    } catch (error: any) {
      if (error.code === 11000 && error.keyPattern?.email) {
        throw new HttpException('Email already exists', HttpStatus.CONFLICT);
      }
      throw error;
    }
  }


  async findAll(): Promise<User[]> {
    return this.userModel.aggregate([
      // Step 1: Lookup employee
      {
        $lookup: {
          from: 'companies',
          localField: 'tenantId',
          foreignField: '_id',
          as: 'companies'
        }
      },
      { $unwind: { path: '$companies', preserveNullAndEmptyArrays: true } },
    ]).exec();
  }

  async findAllByTenant(tenantId: string): Promise<User[]> { // tenantId is string for MVP
    return this.userModel.find({ tenantId: new Types.ObjectId(tenantId) }).exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<User> { // tenantId is string for MVP
    const user = await this.userModel.findOne({ _id: id, tenantId: new Types.ObjectId(tenantId) }).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found for this tenant`);
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto, performedBy?: string): Promise<User> {
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (updateUserDto.password && !updateUserDto.password.startsWith('$2b$')) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUserDto },
      { new: true }
    ).exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${id}" not found after update`);
    }

    await this.auditService.log(
      'users',
      'update',
      updatedUser._id.toString(),
      {
        newState: updatedUser.toObject(),
        oldState: existingUser.toObject(),
        performedBy: performedBy ? new Types.ObjectId(performedBy) : undefined
      }
    );

    return updatedUser;
  }

  async updateByTenant(id: string, tenantId: string, updateUserDto: UpdateUserDto, performedBy?: string): Promise<User> {
    const existingUser = await this.userModel.findOne({ 
      _id: id, 
      tenantId: new Types.ObjectId(tenantId) 
    }).exec();
    
    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found for this tenant`);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      { $set: updateUserDto },
      { new: true }
    ).exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${id}" not found for this tenant after update`);
    }

    await this.auditService.log(
      'users',
      'update',
      updatedUser._id.toString(),
      {
        newState: updatedUser.toObject(),
        oldState: existingUser.toObject(),
        performedBy: performedBy ? new Types.ObjectId(performedBy) : undefined
      }
    );

    return updatedUser;
  }

  async remove(id: string, performedBy?: string) {
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const result = await this.userModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    await this.auditService.log(
      'users',
      'delete',
      existingUser._id.toString(),
      {
        oldState: existingUser.toObject(),
        performedBy: performedBy ? new Types.ObjectId(performedBy) : undefined
      }
    );

    return result;
  }

  async removeByTenant(id: string, tenantId: string, performedBy?: string): Promise<void> {
    const existingUser = await this.userModel.findOne({ 
      _id: new Types.ObjectId(id), 
      tenantId: new Types.ObjectId(tenantId) 
    }).exec();
    
    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found for this tenant`);
    }

    const result = await this.userModel.deleteOne({ 
      _id: new Types.ObjectId(id), 
      tenantId: new Types.ObjectId(tenantId) 
    }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${id}" not found for this tenant`);
    }

    await this.auditService.log(
      'users',
      'delete',
      existingUser._id.toString(),
      {
        oldState: existingUser.toObject(),
        performedBy: performedBy ? new Types.ObjectId(performedBy) : undefined
      }
    );
  }
}