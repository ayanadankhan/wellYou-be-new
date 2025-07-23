import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRequestMangmentDto } from './dto/create-request-mangment.dto';
import { UpdateRequestMangmentDto } from './dto/update-request-mangment.dto';
import { RequestMangment, RequestMangmentDocument } from './entities/request-mangment.entity';
import { Employee } from '../employees/schemas/Employee.schema';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class requestMangmentervice {
  private readonly logger = new Logger(requestMangmentervice.name);

  constructor(
    @InjectModel(RequestMangment.name)
    private readonly RequestMangmentModel: Model<RequestMangmentDocument>,
    @InjectModel('Employee') private readonly employeeModel: Model<Employee>,
    private attendanceService: AttendanceService,
  ) {}

async create(
  createRequestMangmentDto: CreateRequestMangmentDto,
): Promise<RequestMangmentDocument> {
  if (!Types.ObjectId.isValid(createRequestMangmentDto.employeeId)) {
    throw new BadRequestException('Invalid employee ID format');
  }

  const employee = await this.employeeModel.findOne({
    _id: createRequestMangmentDto.employeeId,
  });

  if (!employee) {
    throw new NotFoundException(
      'Employee not found or does not belong to the user',
    );
  }
  await this.validateRequestByType(createRequestMangmentDto);

  if (createRequestMangmentDto.type === 'leave') {
    await this.checkOverlappingrequestMangment(createRequestMangmentDto);
    
    // Calculate total hours for leave if details are provided
    if (createRequestMangmentDto.leaveDetails) {
      const { from, to } = createRequestMangmentDto.leaveDetails;
      if (from && to) {
        createRequestMangmentDto.leaveDetails.totalHour = this.calculateLeaveHours(from, to);
      }
    }
  }

  // Calculate total hours for overtime if details are provided
  if (createRequestMangmentDto.overtimeDetails) {
    const { fromHour, toHour } = createRequestMangmentDto.overtimeDetails;
    if (fromHour && toHour) {
      createRequestMangmentDto.overtimeDetails.totalHour = this.calculateHoursDifference(fromHour, toHour);
    }
  }

  // Calculate total hours for time off if details are provided
  if (createRequestMangmentDto.timeOffDetails) {
    const { fromHour, toHour } = createRequestMangmentDto.timeOffDetails;
    if (fromHour && toHour) {
      createRequestMangmentDto.timeOffDetails.totalHour = this.calculateHoursDifference(fromHour, toHour);
    }
  }

  if (createRequestMangmentDto.attendanceDetails) {
    // No validation — attendanceDetails may exist, but no check on time order
  }

  const RequestMangment = new this.RequestMangmentModel({
    ...createRequestMangmentDto,
    employeeId: new Types.ObjectId(createRequestMangmentDto.employeeId),
    appliedDate: new Date(),
    workflow: {
      status: 'pending',
      ...createRequestMangmentDto.workflow,
    },
  });

  return await RequestMangment.save();
}

private calculateLeaveHours(from: Date, to: Date): number {
  const startDate = new Date(from);
  const endDate = new Date(to);
  
  // Reset time components to avoid time-related issues
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  let totalDays = 0;
  const currentDate = new Date(startDate);

  // Calculate working days (excluding Sundays)
  while (currentDate <= endDate) {
    // Sunday is day 0 in JavaScript
    if (currentDate.getDay() !== 0) {
      totalDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 8 hours per working day
  return totalDays * 8;
}

private calculateHoursDifference(fromHour: string, toHour: string): number {
  const fromDate = new Date(`1970-01-01T${fromHour}:00`);
  const toDate = new Date(`1970-01-01T${toHour}:00`);
  
  if (toDate < fromDate) {
    toDate.setDate(toDate.getDate() + 1);
  }
  
  const diffInMs = toDate.getTime() - fromDate.getTime();
  return diffInMs / (1000 * 60 * 60);
}

  private async validateRequestByType(dto: CreateRequestMangmentDto): Promise<void> {
    switch (dto.type) {
      case 'leave':
        if (!dto.leaveDetails) {
          throw new BadRequestException('Leave details are required for leave type');
        }
        if (!dto.leaveDetails.from || !dto.leaveDetails.to) {
          throw new BadRequestException('From and to dates are required for leave');
        }
        if (new Date(dto.leaveDetails.to) < new Date(dto.leaveDetails.from)) {
          throw new BadRequestException('To date cannot be before from date');
        }
        break;

      case 'timeOff':
        if (!dto.timeOffDetails) {
          throw new BadRequestException('Time off details are required for timeOff type');
        }
        if (!dto.timeOffDetails.fromHour || !dto.timeOffDetails.toHour) {
          throw new BadRequestException('From and to hours are required for time off');
        }
        this.validateTimeFormat(dto.timeOffDetails.fromHour, dto.timeOffDetails.toHour);
        break;

      case 'overtime':
        if (!dto.overtimeDetails) {
          throw new BadRequestException('Overtime details are required for overtime type');
        }
        if (!dto.overtimeDetails.fromHour || !dto.overtimeDetails.toHour) {
          throw new BadRequestException('From and to hours are required for overtime');
        }
        this.validateTimeFormat(dto.overtimeDetails.fromHour, dto.overtimeDetails.toHour);
        break;

        case 'attendance':
          if (!dto.attendanceDetails) {
            throw new BadRequestException('Attendance details are required for attendance type');
          }
          break;

      default:
        throw new BadRequestException('Invalid request type');
    }
  }

  private validateTimeFormat(fromHour: string, toHour: string): void {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(fromHour) || !timeRegex.test(toHour)) {
      throw new BadRequestException('Invalid time format. Use HH:MM format (e.g., 14:00)');
    }

    const fromTime = new Date(`1970-01-01T${fromHour}:00`);
    const toTime = new Date(`1970-01-01T${toHour}:00`);

    if (toTime <= fromTime) {
      throw new BadRequestException('To hour must be after from hour');
    }
  }

  private async checkOverlappingrequestMangment(dto: CreateRequestMangmentDto): Promise<void> {
    if (!dto.leaveDetails?.from || !dto.leaveDetails?.to) return;

    const startDate = new Date(dto.leaveDetails.from);
    const endDate = new Date(dto.leaveDetails.to);

    const overlappingRequest = await this.RequestMangmentModel.findOne({
      employeeId: dto.employeeId,
      type: 'leave',
      $or: [
        {
          'leaveDetails.from': { $lte: endDate },
          'leaveDetails.to': { $gte: startDate },
        },
        {
          'leaveDetails.from': { $gte: startDate, $lte: endDate },
        },
      ],
      'workflow.status': { $nin: ['rejected'] },
    });

    if (overlappingRequest) {
      throw new ConflictException(
        'Employee already has a leave request for this period',
      );
    }
  }

  private grouprequestMangmentByEmployee(
    requestMangment: any[],
    employeeIds: Types.ObjectId[],
    currentEmployeeId: Types.ObjectId | null
  ) {
    const grouped = employeeIds.map(empId => {
      const empRequests = requestMangment.filter(lr => lr.employeeId._id.equals(empId));
      return {
        employeeId: empId,
        isCurrentUser: currentEmployeeId ? empId.equals(currentEmployeeId) : false,
        Requests: empRequests,
        count: empRequests.length
      };
    });

    const filtered = grouped.filter(group => group.count > 0);

    return filtered;
  }

  async getRoleBasedrequestMangment(
    user: any,
    status?: string,
    type?: string,
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
      ...(status && { 'workflow.status': status }),
      ...(type && { type }),
    };

    // Date filtering for leave type
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      query.$or = [
        // For leave type - check leaveDetails dates
        {
          type: 'leave',
          'leaveDetails.from': { $lte: end },
          'leaveDetails.to': { $gte: start }
        },
        // For other types - check appliedDate
        {
          type: { $in: ['timeOff', 'overtime'] },
          appliedDate: { $gte: start, $lte: end }
        }
      ];
    }

    this.logger.log(`Leave request query: ${JSON.stringify(query)}`);

    // Fetch leave requests with related employee + user info
  const requestMangment = await this.RequestMangmentModel.find(query)
    .populate({
      path: 'employeeId',
      model: 'Employee',
      select: 'userId positionId departmentId profilePicture', // Only select these fields
      populate: [
        {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName', // Only name fields
        },
        {
          path: 'positionId',
          model: 'Designation',
          select: 'title', // Only position name
        },
        {
          path: 'departmentId',
          model: 'Department',
          select: 'departmentName', // Only department name
        }
      ]
    })
    .sort({ appliedDate: -1 })
    .exec();

    // Group data by employee
    return this.grouprequestMangmentByEmployee(
      requestMangment,
      employeeIdsToQuery,
      currentEmployeeId
    );
  }

  async findOne(id: string): Promise<RequestMangmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave request ID format');
    }

    const RequestMangment = await this.RequestMangmentModel
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

    if (!RequestMangment) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    return RequestMangment;
  }

  async update(
    id: string,
    updateRequestMangmentDto: UpdateRequestMangmentDto,
  ): Promise<RequestMangmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave request ID format');
    }

    const existing = await this.RequestMangmentModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    // Validate updated data by type
    if (updateRequestMangmentDto.type || updateRequestMangmentDto.leaveDetails || 
        updateRequestMangmentDto.timeOffDetails || updateRequestMangmentDto.overtimeDetails) {
      const mergedDto = { ...existing.toObject(), ...updateRequestMangmentDto };
      await this.validateRequestByType(mergedDto as any);
    }

    const updated = await this.RequestMangmentModel
      .findByIdAndUpdate(id, updateRequestMangmentDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }
    if (updated.workflow?.status === 'approved' && updated.type === 'leave') {
      const leaveDetails = updated.leaveDetails;
      if (leaveDetails?.from && leaveDetails?.to) {
        const fromDate = new Date(leaveDetails.from);
        const toDate = new Date(leaveDetails.to);

        const dates: Date[] = [];
        const current = new Date(fromDate);
        while (current <= toDate) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }

        await this.attendanceService.markAbsentForLeave(updated.employeeId.toString(), dates);
      }
    }

    return updated;
  }

  async changeStatus(
    id: string,
    status: string,
    actionBy?: string,
    rejectionReason?: string,
  ): Promise<RequestMangmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave request ID format');
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const updateData: any = {
      'workflow.status': status,
    };

    if (actionBy) {
      updateData['workflow.actionBy'] = actionBy;
    }

    if (status === 'approved') {
      updateData['workflow.approvalDate'] = new Date();
    }

    if (status === 'rejected' && rejectionReason) {
      updateData['workflow.rejectionReason'] = rejectionReason;
    }

    const updated = await this.RequestMangmentModel
      .findByIdAndUpdate(id, updateData, { new: true })
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

    const result = await this.RequestMangmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }
  }
}