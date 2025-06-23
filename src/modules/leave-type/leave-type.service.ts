import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaveType, LeaveTypeDocument, LeaveTypeSchema } from './entities/leave-type.entity'; // Adjust import path as needed
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@Injectable()
export class LeaveTypeService {
  constructor(
    @InjectModel(LeaveType.name)
    private readonly leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  async create(createLeaveTypeDto: CreateLeaveTypeDto): Promise<LeaveTypeDocument> {
    // Check if leave type with same name already exists
    const existingLeaveType = await this.leaveTypeModel.findOne({
      name: createLeaveTypeDto.name,
    });

    if (existingLeaveType) {
      throw new ConflictException('Leave type with this name already exists');
    }

    const leaveType = new this.leaveTypeModel(createLeaveTypeDto);
    return await leaveType.save();
  }

  async findAll(): Promise<LeaveTypeDocument[]> {
    return await this.leaveTypeModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActive(): Promise<LeaveTypeDocument[]> {
    return await this.leaveTypeModel
      .find({ active: true })
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<LeaveTypeDocument> {
    const leaveType = await this.leaveTypeModel.findById(id).exec();

    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${id} not found`);
    }

    return leaveType;
  }

  async update(id: string, updateLeaveTypeDto: UpdateLeaveTypeDto): Promise<LeaveTypeDocument> {
    // Check if updating name and if new name conflicts with existing
    if (updateLeaveTypeDto.name) {
      const existingLeaveType = await this.leaveTypeModel.findOne({
        name: updateLeaveTypeDto.name,
        _id: { $ne: id },
      });

      if (existingLeaveType) {
        throw new ConflictException('Leave type with this name already exists');
      }
    }

    const leaveType = await this.leaveTypeModel
      .findByIdAndUpdate(id, updateLeaveTypeDto, { new: true })
      .exec();

    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${id} not found`);
    }

    return leaveType;
  }

  async remove(id: string): Promise<void> {
    const result = await this.leaveTypeModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Leave type with ID ${id} not found`);
    }
  }

  async toggleActive(id: string): Promise<LeaveTypeDocument> {
    const leaveType = await this.findOne(id);
    leaveType.active = !leaveType.active;
    return await leaveType.save();
  }

  async count(): Promise<number> {
    return await this.leaveTypeModel.countDocuments().exec();
  }

  async findByName(name: string): Promise<LeaveTypeDocument | null> {
    return await this.leaveTypeModel.findOne({ name }).exec();
  }
}