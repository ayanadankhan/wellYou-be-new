
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

async createDefaultSuperAdmin(): Promise<void> {
  console.log("🛠️ createDefaultSuperAdmin called");

  const existing = await this.userModel.findOne({ email: 'admin@gmail.com' });
  console.log("🧪 Existing User Found:", existing);

  if (!existing) {
    const hashedPassword = await bcrypt.hash('12345678', 10);
    const superAdmin = new this.userModel({
      email: 'admin@gmail.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
    });
    await superAdmin.save();
    console.log('✅ Default Super Admin created successfully');
  } else {
    console.log('ℹ️ Default Super Admin already exists');
  }
}

async create(createUserDto: CreateUserDto): Promise<User> {
  // Remove the hashing - it should already be done by AuthService
  const createdUser = new this.userModel({
    ...createUserDto,
    // password is already hashed when it comes here
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

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async removeByTenant(id: string, tenantId: string): Promise<void> { // tenantId is string for MVP
    const result = await this.userModel.deleteOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${id}" not found for this tenant`);
    }
  }
}
