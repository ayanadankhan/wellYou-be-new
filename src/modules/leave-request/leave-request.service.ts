import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequest, LeaveRequestDocument } from './entities/leave-type.entity';
import { Employee } from '../employees/schemas/Employee.schema';


@Injectable()
export class LeaveRequestService {
  private readonly logger = new Logger(LeaveRequestService.name);

  constructor(
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel('Employee') private readonly employeeModel: Model<Employee>,
  ) {}

  async create(
    createLeaveRequestDto: CreateLeaveRequestDto,
    // userId: Types.ObjectId,
  ): Promise<LeaveRequestDocument> {
    // Validate employeeId
    if (!Types.ObjectId.isValid(createLeaveRequestDto.employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    // Find employee and verify it belongs to the user
    const employee = await this.employeeModel.findOne({
      _id: createLeaveRequestDto.employeeId,
      // userId: userId,
    });

    if (!employee) {
      throw new NotFoundException(
        'Employee not found or does not belong to the user',
      );
    }

    // Validate dates
    const startDate = new Date(createLeaveRequestDto.startDate);
    const endDate = new Date(createLeaveRequestDto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Check for overlapping leave requests
    const overlappingRequest = await this.leaveRequestModel.findOne({
      employeeId: createLeaveRequestDto.employeeId,
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
        {
          startDate: { $gte: startDate, $lte: endDate },
        },
      ],
      status: { $nin: ['rejected', 'cancelled'] },
    });

    if (overlappingRequest) {
      throw new ConflictException(
        'Employee already has a leave request for this period',
      );
    }

    const leaveRequest = new this.leaveRequestModel({
      ...createLeaveRequestDto,
      employeeId: new Types.ObjectId(createLeaveRequestDto.employeeId),
      status: 'pending',
    });

    return await leaveRequest.save();
  }

private groupLeaveRequestsByEmployee(
  leaveRequests: any[],
  employeeIds: Types.ObjectId[],
  currentEmployeeId: Types.ObjectId | null
) {
  const grouped = employeeIds.map(empId => {
    const empRequests = leaveRequests.filter(lr => lr.employeeId._id.equals(empId));
    return {
      employeeId: empId,
      isCurrentUser: currentEmployeeId ? empId.equals(currentEmployeeId) : false,
      leaveRequests: empRequests,
      count: empRequests.length
    };
  });

  const filtered = grouped.filter(group => group.count > 0);

  return filtered;
}


async getRoleBasedLeaveRequests(
  user: any,
  status?: string,
  startDate?: string,
  endDate?: string,
): Promise<any[]> {
  const userId = user._id;
  const userRole = user.role;
  const tenantId = user.tenantId;

  this.logger.log(`Fetching leave requests for user ${userId}, role ${userRole}`);

  if (!Types.ObjectId.isValid(userId)) {
    throw new BadRequestException('Invalid user ID format');
  }

  let employeeIdsToQuery: Types.ObjectId[] = [];
  let currentEmployeeId: Types.ObjectId | null = null;

  if (userRole === 'company_admin') {
    if (!tenantId) {
      throw new BadRequestException('Admin missing tenant information');
    }

    const employees = await this.employeeModel.find({ tenantId }).select('_id').exec();
    employeeIdsToQuery = employees.map(e => e._id);
  } else {
    const currentEmployee = await this.employeeModel.findOne({ userId }).exec();
    if (!currentEmployee) {
      this.logger.warn(`No employee record found for user ${userId}`);
      return [];
    }

    currentEmployeeId = currentEmployee._id;
    employeeIdsToQuery.push(currentEmployeeId);

    const teamMembers = await this.employeeModel
      .find({ reportingTo: userId })
      .select('_id')
      .exec();
    if (teamMembers.length > 0) {
      employeeIdsToQuery.push(...teamMembers.map(m => m._id));
    }
  }

  // Build the query
  const query: any = {
    employeeId: { $in: employeeIdsToQuery },
    ...(status && { status }),
  };

  // Date filtering if provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    query.$or = [
      { startDate: { $lte: end }, endDate: { $gte: start } }, // Overlapping
      { startDate: { $gte: start, $lte: end } }, // Starts in range
      { endDate: { $gte: start, $lte: end } }, // Ends in range
    ];
  }

  this.logger.log(`Leave request query: ${JSON.stringify(query)}`);

  // Fetch leave requests with related employee + user info
  const leaveRequests = await this.leaveRequestModel.find(query)
    .populate({
      path: 'employeeId',
      model: 'Employee',
      populate: {
        path: 'userId',
        model: 'User',
        select: 'firstName lastName',
      },
    })
    .exec();

  // Group data by employee
  return this.groupLeaveRequestsByEmployee(
    leaveRequests,
    employeeIdsToQuery,
    currentEmployeeId
  );
}


  async findOne(id: string): Promise<LeaveRequestDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave request ID format');
    }

    const leaveRequest = await this.leaveRequestModel
      .findById(id)
      .populate({
        path: 'employeeId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'firstName lastName',
        },
      })
      .exec();

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    return leaveRequest;
  }

  async update(
    id: string,
    updateLeaveRequestDto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequestDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave request ID format');
    }

    // Validate dates if they're being updated
    if (updateLeaveRequestDto.startDate || updateLeaveRequestDto.endDate) {
      const existing = await this.leaveRequestModel.findById(id).exec();
      if (!existing) {
        throw new NotFoundException(`Leave request with ID ${id} not found`);
      }

      const startDate = updateLeaveRequestDto.startDate
        ? new Date(updateLeaveRequestDto.startDate)
        : existing.startDate;
      const endDate = updateLeaveRequestDto.endDate
        ? new Date(updateLeaveRequestDto.endDate)
        : existing.endDate;

      if (endDate < startDate) {
        throw new BadRequestException('End date cannot be before start date');
      }
    }

    const updated = await this.leaveRequestModel
      .findByIdAndUpdate(id, updateLeaveRequestDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    return updated;
  }

  async changeStatus(
    id: string,
    status: string,
    comment?: string,
  ): Promise<LeaveRequestDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave request ID format');
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const update: any = { status };
    if (comment) {
      update.comment = comment;
    }

    const updated = await this.leaveRequestModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave request ID format');
    }

    const result = await this.leaveRequestModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }
  }
}