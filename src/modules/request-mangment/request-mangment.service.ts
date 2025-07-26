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
import { GetRequestDto } from './dto/get-request-mangment.dto';

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

    let adminApproval = false;

  if (createRequestMangmentDto.type === 'leave') {
    await this.checkOverlappingrequestMangment(createRequestMangmentDto);
    
    // Calculate total hours for leave if details are provided
    if (createRequestMangmentDto.leaveDetails) {
      const { from, to } = createRequestMangmentDto.leaveDetails;
      if (from && to) {
        const totalHours = this.calculateLeaveHours(from, to);
        createRequestMangmentDto.leaveDetails.totalHour = totalHours;
        
        if (totalHours > 8) {
          adminApproval = true;
        }
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

    if (createRequestMangmentDto.type === 'loan') {
    adminApproval = true;
  }

  const RequestMangment = new this.RequestMangmentModel({
    ...createRequestMangmentDto,
    employeeId: new Types.ObjectId(createRequestMangmentDto.employeeId),
    appliedDate: new Date(),
    adminApproval,
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

        case 'loan':
          if (!dto.loanDetails) {
            throw new BadRequestException('Loan details are required for loan type');
          }
          if (!dto.loanDetails.loanAmount || dto.loanDetails.loanAmount <= 0) {
            throw new BadRequestException('Valid loan amount is required');
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

  async getRoleBasedrequestMangment(user: any,getDto: GetRequestDto,): Promise<{
    myRequests: any[];
    teamRequests: any[];
    summary: {
      totalRequests: number;
      myRequestsCount: number;
      teamRequestsCount: number;
    };
  }> {
    const userId = user._id;
    const userRole = user.role;
    const tenantId = user.tenantId;

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    let employeeIdsToQuery: Types.ObjectId[] = [];
    let currentEmployeeId: Types.ObjectId | null = null;
    let teamMemberIds: Types.ObjectId[] = [];

    if (userRole === 'company_admin') {
      if (!tenantId) {
        throw new BadRequestException('Admin missing tenant info');
      }

      const employees = await this.employeeModel.find({ tenantId }).select('_id').exec();
      employeeIdsToQuery = employees.map(e => e._id);
    } else {
      const currentEmployee = await this.employeeModel.findOne({ userId }).exec();
      if (!currentEmployee) {
        throw new BadRequestException('Employee not found');
      }

      currentEmployeeId = currentEmployee._id;
      employeeIdsToQuery.push(currentEmployeeId);

      const teamMembers = await this.employeeModel
        .find({ reportingTo: userId })
        .select('_id')
        .exec();

      if (teamMembers.length > 0) {
        const teamIds = teamMembers.map(m => m._id);
        employeeIdsToQuery.push(...teamIds);
        teamMemberIds = teamIds;
      }
    }

    const query: any = {
      employeeId: { $in: employeeIdsToQuery },
    };

    if (getDto.type) query.type = getDto.type;
    if (getDto.status) query['workflow.status'] = getDto.status;

    let records = await this.RequestMangmentModel.find(query)
      .populate({
        path: 'employeeId',
        model: 'Employee',
        select: 'userId reportingTo positionId departmentId profilePicture',
        populate: [
          { path: 'userId', model: 'User', select: 'firstName lastName' },
          { path: 'reportingTo', model: 'User', select: 'firstName lastName' },
          { path: 'positionId', model: 'Designation', select: 'title' },
          { path: 'departmentId', model: 'Department', select: 'departmentName' },
        ],
      })
      .exec();

    if (getDto.name) {
      const nameRegex = new RegExp(getDto.name, 'i');
      records = records.filter(r => {
        const emp: any = r.employeeId;
        const user = emp?.userId;
        return user?.firstName?.match(nameRegex) || user?.lastName?.match(nameRegex);
      });
    }

    const sortField = getDto.sb || 'appliedDate';
    const sortOrder = getDto.sd === '1' ? 1 : -1;
    records.sort((a, b) => {
      const valA = (a as any)[sortField];
      const valB = (b as any)[sortField];
      return sortOrder * (valA > valB ? 1 : valA < valB ? -1 : 0);
    });

    const offset = Number(getDto.o || 0);
    const limit = Number(getDto.l || 10);
    const paginated = records.slice(offset, offset + limit);

    let myRequests: any[] = [];
    let teamRequests: any[] = [];

    if (userRole === 'company_admin') {
      teamRequests = paginated;
    } else {
      myRequests = paginated.filter(r => r.employeeId._id.equals(currentEmployeeId));
      teamRequests = paginated.filter(r => teamMemberIds.some(id => id.equals(r.employeeId._id)));
    }

    return {
      myRequests,
      teamRequests,
      summary: {
        totalRequests: paginated.length,
        myRequestsCount: myRequests.length,
        teamRequestsCount: teamRequests.length,
      },
    };
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
        updateRequestMangmentDto.timeOffDetails || updateRequestMangmentDto.overtimeDetails || updateRequestMangmentDto.loanDetails) {
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