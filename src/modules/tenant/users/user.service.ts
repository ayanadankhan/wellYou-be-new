
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

async create(createUserDto: CreateUserDto): Promise<User> {
  // Ensure tenantId is in correct ObjectId format
  if (createUserDto.tenantId && typeof createUserDto.tenantId === 'string') {
    createUserDto.tenantId = new Types.ObjectId(createUserDto.tenantId) as any;
  }

  const createdUser = new this.userModel({
    ...createUserDto,
  });

  return createdUser.save();
}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const existingUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUserDto },
      { new: true }
    ).exec();

    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return existingUser;
  }

  async updateByTenant(id: string, tenantId: string, updateUserDto: UpdateUserDto): Promise<User> { // tenantId is string for MVP
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const existingUser = await this.userModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      { $set: updateUserDto },
      { new: true }
    ).exec();

    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found for this tenant`);
    }
    return existingUser;
  }

  async remove(id: string) {
    const result = await this.userModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return result
  }

  async removeByTenant(id: string, tenantId: string): Promise<void> { // tenantId is string for MVP
    const result = await this.userModel.deleteOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${id}" not found for this tenant`);
    }
  }
}
