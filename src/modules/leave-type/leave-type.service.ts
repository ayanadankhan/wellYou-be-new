import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveType, LeaveTypeDocument, LeaveTypeSchema } from './entities/leave-type.entity'; // Adjust import path as needed
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { GetLeaveTypeDto } from './dto/get-leave-type.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';

@Injectable()
export class LeaveTypeService {
  constructor(
    @InjectModel(LeaveType.name)
    private readonly leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  async create(createLeaveTypeDto: CreateLeaveTypeDto , user: AuthenticatedUser): Promise<LeaveTypeDocument> {
    // Check if leave type with same name already exists
    const existingLeaveType = await this.leaveTypeModel.findOne({
      name: createLeaveTypeDto.name,
    });

    if (existingLeaveType) {
      throw new ConflictException('Leave type with this name already exists');
    }

    const leaveType = new this.leaveTypeModel({
      ...createLeaveTypeDto,
      tenantId: new Types.ObjectId(user.tenantId),
    });
    return await leaveType.save();
  }

  async findAll(getDto: GetLeaveTypeDto, user: AuthenticatedUser) {
    try {
      const pipeline: any[] = [];
  
      if (user?.tenantId) {
        pipeline.push({ $match: { tenantId: new Types.ObjectId(user.tenantId) } });
      }
  
      if (getDto.name) {
        pipeline.push({ $match: { name: new RegExp(getDto.name, 'i') } });
      }
  
      const active =
      typeof getDto.active === 'string'
        ? getDto.active === 'true'
        : getDto.active;
  
      if (active !== undefined) {
        pipeline.push({ $match: { active } });
      }
      const [list, countQuery] = await Promise.all([
        this.leaveTypeModel.aggregate([
          ...pipeline,
          { $sort: { [getDto.sb || 'createdAt']: getDto.sd === '1' ? 1 : -1 } },
          { $skip: Number(getDto.o || 0) },
          { $limit: Number(getDto.l || 10) },
        ]).exec(),
  
        this.leaveTypeModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);
  
      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch additions',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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