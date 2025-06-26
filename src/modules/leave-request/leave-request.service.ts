import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from './entities/leave-type.entity'; // Adjust import path as needed
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,
  ) {}

  async create(createLeaveRequestDto: CreateLeaveRequestDto): Promise<LeaveRequestDocument> {
    // Basic validation for MongoDB ObjectId format
    if (!createLeaveRequestDto.employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    // Validate dates
    if (new Date(createLeaveRequestDto.endDate) < new Date(createLeaveRequestDto.startDate)) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Check for overlapping leave requests
    const overlappingRequest = await this.leaveRequestModel.findOne({
      employeeId: createLeaveRequestDto.employeeId,
      $or: [
        {
          startDate: { $lte: createLeaveRequestDto.endDate },
          endDate: { $gte: createLeaveRequestDto.startDate },
        },
        {
          startDate: { $gte: createLeaveRequestDto.startDate, $lte: createLeaveRequestDto.endDate },
        },
      ],
      status: { $ne: 'rejected' },
    });

    if (overlappingRequest) {
      throw new ConflictException('Employee already has a leave request for this period');
    }

    const leaveRequest = new this.leaveRequestModel({
      ...createLeaveRequestDto,
      status: 'pending',
    });
    return await leaveRequest.save();
  }

  async findAll(): Promise<LeaveRequestDocument[]> {
    return await this.leaveRequestModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(status: string): Promise<LeaveRequestDocument[]> {
    return await this.leaveRequestModel
      .find({ status })
      .sort({ startDate: 1 })
      .exec();
  }

  async findOne(id: string): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(id).exec();

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    return leaveRequest;
  }

  async update(id: string, updateLeaveRequestDto: UpdateLeaveRequestDto): Promise<LeaveRequestDocument> {
    // Validate dates if they're being updated
    if (updateLeaveRequestDto.startDate || updateLeaveRequestDto.endDate) {
      const leaveRequest = await this.findOne(id);
      const startDate = updateLeaveRequestDto.startDate 
        ? new Date(updateLeaveRequestDto.startDate) 
        : leaveRequest.startDate;
      const endDate = updateLeaveRequestDto.endDate 
        ? new Date(updateLeaveRequestDto.endDate) 
        : leaveRequest.endDate;

      if (endDate < startDate) {
        throw new BadRequestException('End date cannot be before start date');
      }
    }

    const updatedRequest = await this.leaveRequestModel
      .findByIdAndUpdate(id, updateLeaveRequestDto, { new: true })
      .exec();

    if (!updatedRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    return updatedRequest;
  }

  async remove(id: string): Promise<void> {
    const result = await this.leaveRequestModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }
  }

  async changeStatus(id: string, status: string): Promise<LeaveRequestDocument> {
    const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const updatedRequest = await this.leaveRequestModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!updatedRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    return updatedRequest;
  }

  async count(): Promise<number> {
    return await this.leaveRequestModel.countDocuments().exec();
  }

  async findByEmployee(employeeId: string): Promise<LeaveRequestDocument[]> {
    if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    return await this.leaveRequestModel
      .find({ employeeId })
      .sort({ startDate: -1 })
      .exec();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<LeaveRequestDocument[]> {
    return await this.leaveRequestModel
      .find({
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      })
      .sort({ startDate: 1 })
      .exec();
  }
}