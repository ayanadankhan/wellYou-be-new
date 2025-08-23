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
import { AuditService } from '../audit/audit.service';

@Injectable()
export class requestMangmentervice {
  private readonly logger = new Logger(requestMangmentervice.name);

  constructor(
    @InjectModel(RequestMangment.name)
    private readonly RequestMangmentModel: Model<RequestMangmentDocument>,
    @InjectModel('Employee') private readonly employeeModel: Model<Employee>,
    private attendanceService: AttendanceService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createRequestMangmentDto: CreateRequestMangmentDto, currentUser?: any
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

    if (createRequestMangmentDto.overtimeDetails) {
      const { fromHour, toHour } = createRequestMangmentDto.overtimeDetails;
      if (fromHour && toHour) {
        createRequestMangmentDto.overtimeDetails.totalHour = this.calculateHoursDifference(fromHour, toHour);
      }
    }

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

    const savedRequest = await RequestMangment.save();

      await this.auditService.log(
        'requests',
        'create',
        currentUser._id.toString(),
        savedRequest.toObject(),
        null
      );

    return savedRequest;
  }

  private calculateLeaveHours(from: Date, to: Date): number {
    const startDate = new Date(from);
    const endDate = new Date(to);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    let totalDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (currentDate.getDay() !== 0) {
        totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

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

    const totalRequests = await this.RequestMangmentModel.countDocuments(query);

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
        totalRequests,
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
    currentUser?: any
  ): Promise<RequestMangmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave request ID format');
    }

    const existing = await this.RequestMangmentModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

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

    await this.auditService.log(
      'requests',
      'update',
      currentUser._id.toString(),
      updated.toObject(),
      existing.toObject()
    );

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

  async remove(id: string, currentUser?: any,): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave request ID format');
    }
    const result = await this.RequestMangmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    await this.auditService.log(
      'requests',
      'delete',
      currentUser?._id?.toString(),
      null,
      result.toObject()
    );
  }

  async getLoanAndOvertimeByEmployeeId(employeeId: string): Promise<RequestMangmentDocument[]> {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }

    return this.RequestMangmentModel.find({
      employeeId: new Types.ObjectId(employeeId),
      type: { $in: ['loan', 'overtime'] },
      'workflow.status': 'approved',
    }).exec();
  }

  private getDateRangeFromFilters(from?: string, to?: string, month?: string): { startDate: Date, endDate: Date } {
    if (month) {
      // Parse month in format YYYY-MM
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }

    if (from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    // Default to current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  async getCurrentMonthLeaveReport(
    tenantId: string,
    from?: string,
    to?: string,
    month?: string
  ) {
    this.logger.log(`📌 TenantId received: ${tenantId}`);

    // Get date range based on filters
    const { startDate, endDate } = this.getDateRangeFromFilters(from, to, month);

    // Calculate previous period for comparison (same length as current period)
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const getLeaveCounts = async (queryStartDate: Date, queryEndDate: Date) => {
      return await this.RequestMangmentModel.aggregate([
        {
          $match: {
            type: 'leave',
            $or: [
              {
                'leaveDetails.from': { $gte: queryStartDate, $lte: queryEndDate }
              },
              {
                'leaveDetails.to': { $gte: queryStartDate, $lte: queryEndDate }
              },
              {
                $and: [
                  { 'leaveDetails.from': { $lte: queryStartDate } },
                  { 'leaveDetails.to': { $gte: queryEndDate } }
                ]
              }
            ]
          }
        },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' },
        { $match: { 'employee.tenantId': new Types.ObjectId(tenantId) } },
        {
          $addFields: {
            leaveDays: {
              $let: {
                vars: {
                  adjustedFrom: {
                    $max: ["$leaveDetails.from", queryStartDate]
                  },
                  adjustedTo: {
                    $min: ["$leaveDetails.to", queryEndDate]
                  }
                },
                in: {
                  $add: [
                    {
                      $dateDiff: {
                        startDate: "$$adjustedFrom",
                        endDate: "$$adjustedTo",
                        unit: "day"
                      }
                    },
                    1 // inclusive count
                  ]
                }
              }
            }
          }
        },
        {
          $group: {
            _id: '$workflow.status',
            totalLeaves: { $sum: '$leaveDays' }
          }
        }
      ]);
    };

    const sumLeaves = (counts: any[], status?: string) => {
      if (!status) return counts.reduce((sum, c) => sum + c.totalLeaves, 0);
      const item = counts.find(c => c._id === status);
      return item ? item.totalLeaves : 0;
    };

    const currentCounts = await getLeaveCounts(startDate, endDate);
    const lastCounts = await getLeaveCounts(prevStartDate, prevEndDate);

    const totalLeaves = sumLeaves(currentCounts);
    const pendingLeaves = sumLeaves(currentCounts, 'pending');
    const approvedLeaves = sumLeaves(currentCounts, 'approved');
    const rejectedLeaves = sumLeaves(currentCounts, 'rejected');

    const lastTotalLeaves = sumLeaves(lastCounts);
    const lastApprovedLeaves = sumLeaves(lastCounts, 'approved');
    const lastRejectedLeaves = sumLeaves(lastCounts, 'rejected');

    const approvalRate = totalLeaves === 0 ? 0 : (approvedLeaves / totalLeaves) * 100;
    const rejectionRate = totalLeaves === 0 ? 0 : (rejectedLeaves / totalLeaves) * 100;

    const lastApprovalRate = lastTotalLeaves === 0 ? 0 : (lastApprovedLeaves / lastTotalLeaves) * 100;
    const lastRejectionRate = lastTotalLeaves === 0 ? 0 : (lastRejectedLeaves / lastTotalLeaves) * 100;

    const comparisonFromLastMonthValue =
      lastTotalLeaves === 0 ? 100 : ((totalLeaves - lastTotalLeaves) / lastTotalLeaves) * 100;

    const comparisonFromLastMonthApprovalRateValue =
      lastApprovalRate === 0 ? 100 : ((approvalRate - lastApprovalRate) / lastApprovalRate) * 100;

    const comparisonFromLastMonthRejectionRateValue =
      lastRejectionRate === 0 ? 100 : ((rejectionRate - lastRejectionRate) / lastRejectionRate) * 100;

    const monthlyTrends = await this.getMonthlyLeaveTrends(tenantId);
    const leaveTypes = await this.getLeaveTypesDistribution(tenantId, from, to, month);
    const departmentLeaves = await this.getDepartmentLeaves(tenantId, from, to, month);
    const recentRequests = await this.getRecentLeaveRequests(tenantId);

    return {
      report: {
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        comparisonFromLastMonth: `${comparisonFromLastMonthValue >= 0 ? '+' : ''}${comparisonFromLastMonthValue.toFixed(2)}%`,
        comparisonFromLastMonthApprovalRate: `${comparisonFromLastMonthApprovalRateValue >= 0 ? '+' : ''}${comparisonFromLastMonthApprovalRateValue.toFixed(2)}%`,
        comparisonFromLastMonthRejectionRate: `${comparisonFromLastMonthRejectionRateValue >= 0 ? '+' : ''}${comparisonFromLastMonthRejectionRateValue.toFixed(2)}%`
      },
      monthlyTrends,
      leaveTypes,
      departmentLeaves,
      recentRequests
    };
  }

  async getMonthlyLeaveTrends(tenantId: string) {
    // Last 12 months range
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const endOfYear = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const trends = await this.RequestMangmentModel.aggregate([
      {
        $match: {
          type: 'leave',
          $or: [
            {
              'leaveDetails.from': { $gte: startOfYear, $lte: endOfYear }
            },
            {
              'leaveDetails.to': { $gte: startOfYear, $lte: endOfYear }
            },
            {
              $and: [
                { 'leaveDetails.from': { $lte: startOfYear } },
                { 'leaveDetails.to': { $gte: endOfYear } }
              ]
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      {
        $match: {
          'employee.tenantId': new Types.ObjectId(tenantId),
        },
      },
      {
        $addFields: {
          leaveMonth: { $month: '$leaveDetails.from' },
          leaveYear: { $year: '$leaveDetails.from' },
          leaveDays: {
            $add: [
              {
                $dateDiff: {
                  startDate: '$leaveDetails.from',
                  endDate: '$leaveDetails.to',
                  unit: 'day',
                },
              },
              1,
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            year: '$leaveYear',
            month: '$leaveMonth',
            status: '$workflow.status',
          },
          totalLeaves: { $sum: '$leaveDays' },
        },
      },
      {
        $group: {
          _id: { year: '$_id.year', month: '$_id.month' },
          approved: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'approved'] }, '$totalLeaves', 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'rejected'] }, '$totalLeaves', 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'pending'] }, '$totalLeaves', 0],
            },
          },
          totalLeaves: { $sum: '$totalLeaves' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }, 
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                months: [
                  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                ],
              },
              in: {
                $arrayElemAt: ['$$months', '$_id.month'],
              },
            },
          },
          requests: '$totalLeaves',
          approved: '$approved',
          rejected: '$rejected',
        },
      },
    ]);

    return trends;
  }

  async getLeaveTypesDistribution(
    tenantId: string,
    from?: string,
    to?: string,
    month?: string
  ) {
    const { startDate, endDate } = this.getDateRangeFromFilters(from, to, month);

    const leaveTypes = await this.RequestMangmentModel.aggregate([
      {
        $match: {
          type: 'leave',
          $or: [
            {
              'leaveDetails.from': { $gte: startDate, $lte: endDate }
            },
            {
              'leaveDetails.to': { $gte: startDate, $lte: endDate }
            },
            {
              $and: [
                { 'leaveDetails.from': { $lte: startDate } },
                { 'leaveDetails.to': { $gte: endDate } }
              ]
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $match: {
          'employee.tenantId': new Types.ObjectId(tenantId)
        }
      },
      {
        $addFields: {
          leaveDays: {
            $add: [
              {
                $dateDiff: {
                  startDate: '$leaveDetails.from',
                  endDate: '$leaveDetails.to',
                  unit: 'day'
                }
              },
              1
            ]
          }
        }
      },
      {
        $group: {
          _id: '$leaveDetails.leaveType',
          totalLeaves: { $sum: '$leaveDays' }
        }
      }
    ]);

    const totalLeaves = leaveTypes.reduce((sum, lt) => sum + lt.totalLeaves, 0) || 1;

    const getRandomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };

    return leaveTypes.map(lt => ({
      name: lt._id ? lt._id.charAt(0).toUpperCase() + lt._id.slice(1) : 'Unknown',
      percentage: Number(((lt.totalLeaves / totalLeaves) * 100).toFixed(2)),
      color: getRandomColor(),
    }));
  }

  async getDepartmentLeaves(
    tenantId: string,
    from?: string,
    to?: string,
    month?: string
  ) {
    const { startDate, endDate } = this.getDateRangeFromFilters(from, to, month);

    const departmentLeaves = await this.RequestMangmentModel.aggregate([
      {
        $match: {
          type: 'leave',
          $or: [
            {
              'leaveDetails.from': { $gte: startDate, $lte: endDate }
            },
            {
              'leaveDetails.to': { $gte: startDate, $lte: endDate }
            },
            {
              $and: [
                { 'leaveDetails.from': { $lte: startDate } },
                { 'leaveDetails.to': { $gte: endDate } }
              ]
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $match: {
          'employee.tenantId': new Types.ObjectId(tenantId)
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'employee.departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: '$department' },
      {
        $addFields: {
          leaveDays: {
            $let: {
              vars: {
                adjustedFrom: {
                  $max: ["$leaveDetails.from", startDate]
                },
                adjustedTo: {
                  $min: ["$leaveDetails.to", endDate]
                }
              },
              in: {
                $add: [
                  {
                    $dateDiff: {
                      startDate: "$$adjustedFrom",
                      endDate: "$$adjustedTo",
                      unit: "day"
                    }
                  },
                  1
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$department.departmentName',
          leaves: { $sum: '$leaveDays' }
        }
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          leaves: 1
        }
      },
      { $sort: { leaves: -1 } }
    ]);

    return departmentLeaves;
  }

  async getRecentLeaveRequests(tenantId: string) {
    return await this.RequestMangmentModel.aggregate([
      {
        $match: {
          type: "leave",
          "workflow.status": "pending"
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'emp'
        }
      },
      { $unwind: '$emp' },
      {
        $match: { 'emp.tenantId': new Types.ObjectId(tenantId) }
      },
      {
        $lookup: {
          from: 'users', // userId se name lane ke liye
          localField: 'emp.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'departments',
          localField: 'emp.departmentId',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: '$dept' },
      {
        $addFields: {
          employeeName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          departmentName: '$dept.departmentName'
        }
      },
      {
        $project: {
          emp: 0, // employee ka pura record hide
          user: 0, // user ka pura record hide
          dept: 0  // department ka pura record hide
        }
      },
      { $sort: { appliedDate: -1 } },
      { $limit: 5 }
    ]);
  }

  async getCurrentMonthOverTimeReport(
    tenantId: string,
    from?: string,
    to?: string,
    month?: string
  ) {
    this.logger.log(`📌 TenantId received for overtime: ${tenantId}`);

    const { startDate, endDate } = this.getDateRangeFromFilters(from, to, month);

    const overtimeSummary = await this.RequestMangmentModel.aggregate([
      {
        $match: {
          type: 'overtime',
          appliedDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $match: { 'employee.tenantId': new Types.ObjectId(tenantId) }
      },
      {
        $group: {
          _id: null,
          totalOverTimeApplicants: { $addToSet: '$employeeId' },
          totalOverTimeHours: { $sum: '$overtimeDetails.totalHour' }
        }
      },
      {
        $project: {
          _id: 0,
          totalOverTimeApplicants: { $size: '$totalOverTimeApplicants' },
          totalOverTimeHours: 1,
          totalOvertimeAmount: { $literal: 0 }
        }
      }
    ]);

    const departmentOvertime = await this.RequestMangmentModel.aggregate([
      {
        $match: {
          type: 'overtime',
          appliedDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'emp'
        }
      },
      { $unwind: '$emp' },
      {
        $match: { 'emp.tenantId': new Types.ObjectId(tenantId) }
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'emp.departmentId',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: '$dept' },
      {
        $group: {
          _id: '$dept.departmentName',
          overtimeHours: { $sum: '$overtimeDetails.totalHour' },
          totalApplicants: { $addToSet: '$employeeId' }
        }
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          overtimeHours: 1,
          totalApplicants: { $size: '$totalApplicants' },
          totalOvertimeAmount: { $literal: 0 }
        }
      },
      { $sort: { overtimeHours: -1 } }
    ]);

    const recentOvertimeAgg = await this.RequestMangmentModel.aggregate([
      {
        $match: { 
          type: 'overtime',
          'workflow.status': 'pending',
          appliedDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'emp'
        }
      },
      { $unwind: '$emp' },
      {
        $match: { 'emp.tenantId': new Types.ObjectId(tenantId) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'emp.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'departments',
          localField: 'emp.departmentId',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: '$dept' },
      {
        $addFields: {
          employeeName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          department: '$dept.departmentName',
          overtimeDate: '$appliedDate',
          overtimeReason: '$overtimeDetails.reason'
        }
      },
      {
        $project: {
          emp: 0,
          user: 0,
          dept: 0
        }
      },
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          latestRequests: [
            { $sort: { appliedDate: -1 } },
            { $limit: 3 }
          ]
        }
      },
      {
        $project: {
          totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
          latestRequests: 1
        }
      }
    ]);

    const recentOvertime = {
      totalCount: recentOvertimeAgg[0]?.totalCount || 0,
      latestRequests: recentOvertimeAgg[0]?.latestRequests || []
    };

    return {
      employeeOvertimeData: {
        ...(overtimeSummary[0] || {
          totalOverTimeApplicants: 0,
          totalOverTimeHours: 0,
          totalOvertimeAmount: 0
        }),
        departmentOvertime,
        recentOvertime,
      }
    };
  }
}