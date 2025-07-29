
import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../../mail/mail.service';
import { AuditService } from '../../audit/audit.service';
import { GetUserDto } from './dto/get-user.dto';

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


  async findAll(getDto: GetUserDto) {
    try {
      const pipeline: any[] = [];

      if (getDto.name) {
        pipeline.push({
          $match: {
            $or: [
              { firstName: new RegExp(getDto.name, 'i') },
              { lastName: new RegExp(getDto.name, 'i') },
            ],
          },
        });
      }      

      if (getDto.role) {
        pipeline.push({ $match: { role: getDto.role } });
      }

      if (getDto.tenantId) {
        pipeline.push({ $match: { tenantId: getDto.tenantId } });
      }
      const [list, countQuery] = await Promise.all([
        this.userModel.aggregate([
          ...pipeline,
          // Lookup companies
          {
            $lookup: {
              from: 'companies',
              localField: 'tenantId',
              foreignField: '_id',
              as: 'companies'
            }
          },
          { $unwind: { path: '$companies', preserveNullAndEmptyArrays: true } },
          // Sorting
          { $sort: { [getDto.sb]: getDto.sd === 'asc' ? 1 : -1 } },
          // Pagination
          { $skip: Number(getDto.o) || 0 },
          { $limit: Number(getDto.l) || 10 },
        ]).exec(),
        // Count query (without pagination)
        this.userModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);

      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve users');
    }
  }

  async findAllByTenant(tenantId: string, getDto: GetUserDto) {
    try {
      const pipeline: any[] = [];
      if (!Types.ObjectId.isValid(tenantId)) {
        throw new BadRequestException('Invalid tenant ID');
      }
      
      pipeline.push({ $match: { tenantId: new Types.ObjectId(tenantId) } });
      if (getDto.name) {
        pipeline.push({
          $match: {
            $or: [
              { firstName: new RegExp(getDto.name, 'i') },
              { lastName: new RegExp(getDto.name, 'i') },
            ],
          },
        });
      }

      if (getDto.role) {
        pipeline.push({ $match: { role: getDto.role } });
      }

      const [list, countQuery] = await Promise.all([
        this.userModel.aggregate([
          ...pipeline,
          {
            $lookup: {
              from: 'companies',
              localField: 'tenantId',
              foreignField: '_id',
              as: 'companies',
            },
          },
          { $unwind: { path: '$companies', preserveNullAndEmptyArrays: true } },
          { $sort: { [getDto.sb || 'createdAt']: getDto.sd === 'asc' ? 1 : -1 } },
          { $skip: Number(getDto.o) || 0 },
          { $limit: Number(getDto.l) || 10 },
        ]).exec(),

        this.userModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);

      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve tenant users');
    }
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