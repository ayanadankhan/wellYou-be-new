// src/attendance/attendance.service.ts
import { Injectable, Logger, BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Attendance, AttendanceDocument } from './schemas/Attendance.schema';
import { CreateAttendanceDto } from './dto/create-Attendance.dto';
import { UpdateAttendanceDto } from './dto/update-Attendance.dto';
import { Employee, EmployeeSchema, EmployeeDocument } from '../employees/schemas/Employee.schema';
import { User } from '../tenant/users/schemas/user.schema';

import { EmployeesService } from '../employees/employees.service';
import { GetEmployeeDto } from '../employees/dto/get-Employee.dto';
import { RequestMangment, RequestMangmentDocument } from '../request-mangment/entities/request-mangment.entity';

interface AttendanceResponse {
  success: boolean;
  message: string;
  data: any;
  monthlyStats?: any;
  count: number;
  teamAttendance?: any[];
  allEmployeesAttendance?: any[];
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

constructor(
  @InjectModel(Attendance.name)
  private attendanceModel: Model<AttendanceDocument>,

  @InjectModel(RequestMangment.name)
  private RequestMangmentModel: Model<RequestMangmentDocument>,
  @InjectModel(Employee.name)
  private employeeModel: Model<EmployeeDocument>,
  private employeeService: EmployeesService,
) {}

  // Enhanced method to get attendance based on user role
  async getAttendanceByRole(
    userId: string,
    userRole: string,
    employeeId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceResponse> {
    try {
      this.logger.log(`Fetching attendance for user: ${userId}, role: ${userRole}, target employee: ${employeeId}`);

      let response: AttendanceResponse;

      switch (userRole.toLowerCase()) {
        case 'employee':
          response = await this.getEmployeeAttendance(employeeId, startDate, endDate);
          break;
        
        case 'manager':
          response = await this.getManagerAttendance(userId, employeeId, startDate, endDate);
          break;
        
        case 'company_admin':
          response = await this.getAdminAttendance(userId, employeeId, startDate, endDate);
          break;
        
        default:
          throw new BadRequestException('Invalid user role');
      }

      return response;
    } catch (error) {
      this.logger.error(`Get attendance by role failed:`, error.message);
      throw error;
    }
  }

  // Employee attendance (unchanged)
  private async getEmployeeAttendance(
    employeeId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceResponse> {
    const attendance = await this.getAttendanceByEmployee(employeeId, startDate, endDate);
    const formattedData = this.formatAttendanceData(attendance);
    const monthlyStats = this.calculateMonthlyStats(attendance);

    return {
      success: true,
      message: 'Employee attendance records retrieved successfully',
      data: formattedData,
      monthlyStats,
      count: attendance.length,
    };
  }

  // Manager attendance (own + team)
  private async getManagerAttendance(
    reportingTo: string,
    employeeId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceResponse> {
    // Get manager's own attendance
    const managerAttendance = await this.getAttendanceByEmployee(reportingTo, startDate, endDate);
    const managerFormattedData = this.formatAttendanceData(managerAttendance);
    const managerMonthlyStats = this.calculateMonthlyStats(managerAttendance);

    // Get team members under this manager
    const teamMembers = await this.employeeModel.find({
      reportingTo: new Types.ObjectId(reportingTo),
    }).select('_id name email position');

    this.logger.log(`Found ${teamMembers.length} team members for manager: ${reportingTo}`);

    // Get attendance for all team members
    const teamAttendance = [];
    for (const member of teamMembers) {
      const memberAttendance = await this.getAttendanceByEmployee(
        member._id.toString(),
        startDate,
        endDate,
      );
      
      const memberObj = member.toObject();
      teamAttendance.push({
        employee: {
          id: memberObj._id,
          name: memberObj.name,
          // email: memberObj.email,
          // position: memberObj.position,
        },
        attendance: this.formatAttendanceData(memberAttendance),
        monthlyStats: this.calculateMonthlyStats(memberAttendance),
        count: memberAttendance.length,
      });
    }

    return {
      success: true,
      message: 'Manager and team attendance records retrieved successfully',
      data: managerFormattedData,
      monthlyStats: managerMonthlyStats,
      count: managerAttendance.length,
      teamAttendance,
    };
  }

  // Admin attendance (own + all employees)
  private async getAdminAttendance(
    adminId: string,
    employeeId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceResponse> {
    // Get admin's own attendance
    const adminAttendance = await this.getAttendanceByEmployee(adminId, startDate, endDate);
    const adminFormattedData = this.formatAttendanceData(adminAttendance);
    const adminMonthlyStats = this.calculateMonthlyStats(adminAttendance);

    // Get all employees
    const allEmployees = await this.employeeModel.find({
      _id: { $ne: new Types.ObjectId(adminId) }, // Exclude admin from the list
    }).select('_id name email position reportingTo');

    this.logger.log(`Found ${allEmployees.length} employees for admin view`);

    // Get attendance for all employees
    const allEmployeesAttendance = [];
    for (const employee of allEmployees) {
      const employeeAttendance = await this.getAttendanceByEmployee(
        employee._id.toString(),
        startDate,
        endDate,
      );
      
      // Get manager info if exists
      let managerInfo = null;
      if (employee.reportingTo) {
        const manager = await this.employeeModel.findById(employee.reportingTo).select('name email');
        managerInfo = manager ? { name: manager.name } : null;
      }
      
      allEmployeesAttendance.push({
        employee: {
          id: employee._id,
          name: employee.name,
          // email: employee.email,
          // position: employee.position,
          manager: managerInfo,
        },
        attendance: this.formatAttendanceData(employeeAttendance),
        monthlyStats: this.calculateMonthlyStats(employeeAttendance),
        count: employeeAttendance.length,
      });
    }

    return {
      success: true,
      message: 'Admin and all employees attendance records retrieved successfully',
      data: adminFormattedData,
      monthlyStats: adminMonthlyStats,
      count: adminAttendance.length,
      allEmployeesAttendance,
    };
  }

  // Format attendance data for frontend
  private formatAttendanceData(attendance: Attendance[]): any[] {
    return attendance.map(record => ({
      // id: record._id,
      date: record.date,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      totalHours: record.totalHours || 0,
      status: record.status,
      isAutoCheckout: record.isAutoCheckout || false,
    }));
  }

  async checkin(employeeId: string): Promise<Attendance> {
    try {
      this.logger.log(`Processing check-in for employee: ${employeeId}`);

      if (!Types.ObjectId.isValid(employeeId)) {
        throw new BadRequestException('Invalid employee ID format');
      }

      const today = new Date();
      if (today.getDay() === 0) {
        throw new BadRequestException('Today is Sunday, check-in not allowed');
      }

      const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

      const existingAttendance = await this.attendanceModel.findOne({
        employeeId: new Types.ObjectId(employeeId),
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (existingAttendance) {
        this.logger.warn(`Employee ${employeeId} already checked in today`);
        return existingAttendance;
      }

      const attendanceData = {
        employeeId: new Types.ObjectId(employeeId),
        date: startOfDay,
        checkInTime: new Date(),
        status: 'Present',
      };

      const newAttendance = new this.attendanceModel(attendanceData);
      const savedAttendance = await newAttendance.save();

      this.logger.log(`Check-in successful for employee: ${employeeId}`);
      return savedAttendance;
    } catch (error) {
      this.logger.error(`Check-in failed for employee ${employeeId}:`, error.message);
      throw error;
    }
  }

  // Check-out (Called on logout)
  async checkout(employeeId: string): Promise<Attendance> {
    try {
      this.logger.log(`Processing check-out for employee: ${employeeId}`);

      // Validate ObjectId
      if (!Types.ObjectId.isValid(employeeId)) {
        throw new BadRequestException('Invalid employee ID format');
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      // Find today's attendance record
      const attendance = await this.attendanceModel.findOne({
        employeeId: new Types.ObjectId(employeeId),
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (!attendance) {
        throw new NotFoundException('No check-in record found for today');
      }

      if (attendance.checkOutTime) {
        this.logger.warn(`Employee ${employeeId} already checked out today`);
        return attendance;
      }

      // Update with checkout time and calculate total hours
      const checkOutTime = new Date();
      const totalHours = this.calculateTotalHours(attendance.checkInTime, checkOutTime);

      attendance.checkOutTime = checkOutTime;
      attendance.totalHours = totalHours;
      attendance.status = 'Present';
      attendance.isAutoCheckout = false;

      const updatedAttendance = await attendance.save();
      this.logger.log(`Check-out successful for employee: ${employeeId}`);
      
      return updatedAttendance;
    } catch (error) {
      this.logger.error(`Check-out failed for employee ${employeeId}:`, error.message);
      throw error;
    }
  }

  // Auto checkout at 5:30 PM (to be called by cron job)
  @Cron('55 12 * * *')
  async autoCheckout(): Promise<void> {
    try {
      this.logger.log('Processing auto check-out for all incomplete records');

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      const autoCheckoutTime = new Date();
      autoCheckoutTime.setHours(12, 45, 0, 0);

      const incompleteRecords = await this.attendanceModel.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        checkOutTime: null,
        status: { $ne: "Absent" }
      });

      this.logger.log(`Found ${incompleteRecords.length} incomplete records for auto checkout`);

      for (const record of incompleteRecords) {
        
        const totalHours = this.calculateTotalHours(record.checkInTime, autoCheckoutTime);
        
        await this.attendanceModel.updateOne(
          { _id: record._id },
          {
            checkOutTime: autoCheckoutTime,
            totalHours,
            isAutoCheckout: true,
            status: 'Present',
          },
        );
      }

      const getEmployeeDto = new GetEmployeeDto();
      getEmployeeDto.employmentStatus = 'ACTIVE';
      const EmployeesResponse = await this.employeeService.findAll(getEmployeeDto);
      const allEmployeeIds = EmployeesResponse.list.map((emp: any) => emp._id.toString());
      const existingRecords = await this.attendanceModel.find({
        date: { $gte: startOfDay, $lte: endOfDay },
      }, { employeeId: 1 });
      const presentEmployeeIds = existingRecords.map(record => record.employeeId.toString());
      const missingIds = allEmployeeIds.filter((id: string) => !presentEmployeeIds.includes(id));

      if (missingIds.length > 0) {
      this.logger.log(`Marking ${missingIds.length} employees as absent`);
      
      for (const empId of missingIds) {
        await this.attendanceModel.create({
          employeeId: empId,
          date: today,
          checkInTime: null,
          checkOutTime: null,
          status: 'Absent',  // Absent marked
          isAutoCheckout: false,
          remarks: 'Auto-marked absent (no check-in)', 
        });
      }
    }

      this.logger.log('Auto check-out completed successfully');
    } catch (error) {
      this.logger.error('Auto check-out failed:', error.message);
      throw error;
    }
  }

  // Mark absent employees (to be called by cron job)
  async markAbsentEmployees(employeeIds: string[]): Promise<void> {
    try {
      this.logger.log('Marking absent employees');

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      // Get employees who have attendance record today
      const presentEmployeeIds = await this.attendanceModel.distinct('employeeId', {
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      // Find absent employees
      const absentEmployeeIds = employeeIds.filter(
        (empId) => !presentEmployeeIds.some((presentId) => presentId.toString() === empId),
      );

      // Create absent records
      const absentRecords = absentEmployeeIds.map((empId) => ({
        employeeId: new Types.ObjectId(empId),
        date: startOfDay,
        checkInTime: null,
        checkOutTime: null,
        totalHours: 0,
        status: 'Absent',
        isAutoCheckout: false,
      }));

      if (absentRecords.length > 0) {
        await this.attendanceModel.insertMany(absentRecords);
        this.logger.log(`Marked ${absentRecords.length} employees as absent`);
      }
    } catch (error) {
      this.logger.error('Mark absent employees failed:', error.message);
      throw error;
    }
  }

  // Get attendance by employee and date range (kept for backward compatibility)
 async getAttendanceByEmployee( // Renaming this method to be clearer about what ID it expects is a good idea
                                  // but for now, let's keep the name as you provided it and adjust logic.
    incomingIdFromController: string, // Changed parameter name to avoid confusion with the actual employeeId
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]> {
    try {
      this.logger.log(`Received ID from controller: ${incomingIdFromController}`);

      // 1. Determine if the incomingId is a userId or an employeeId (based on your context, it's a userId)
      //    We need to fetch the actual employeeId from the Employee collection using this userId.

      if (!Types.ObjectId.isValid(incomingIdFromController)) {
        this.logger.warn(`Invalid ID format received: ${incomingIdFromController}`);
        throw new BadRequestException('Invalid ID format');
      }

      let actualEmployeeId: Types.ObjectId;

      // Find the employee using the incoming ID as a userId
      const employee = await this.employeeModel.findOne({ userId: new Types.ObjectId(incomingIdFromController) }).exec();

      if (!employee) {
        this.logger.warn(`No employee found for userId: ${incomingIdFromController}. Cannot fetch attendance.`);
        // If no employee is found for the given userId, there are no attendance records to fetch.
        return [];
      }

      actualEmployeeId = employee._id; // This is the correct employeeId!

      // --- You wanted to fetch and log the employeeId, here it is: ---
      this.logger.log(`Fetched employeeId: ${actualEmployeeId.toHexString()} from userId: ${incomingIdFromController}`);
      // <<<<<<<<<<<<< This is the log you were asking for

      // 2. Now use the actualEmployeeId to query the attendance model
      const query: any = { employeeId: actualEmployeeId }; // Use the correctly obtained employeeId

      this.logger.log(`Querying attendance for employee: ${actualEmployeeId.toHexString()} with date range: ${startDate || 'undefined'} to ${endDate || 'undefined'}`);

      // Add date range filter if provided
      if (startDate || endDate) {
        query.date = {};
        if (startDate) {
          const start = new Date(startDate);
          if (isNaN(start.getTime())) {
            this.logger.warn(`Invalid startDate format: ${startDate}`);
            throw new BadRequestException('Invalid start date format');
          }
          query.date.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          if (isNaN(end.getTime())) {
            this.logger.warn(`Invalid endDate format: ${endDate}`);
            throw new BadRequestException('Invalid end date format');
          }
          end.setHours(23, 59, 59, 999); // Include the entire end day
          query.date.$lte = end;
        }
      }
      
      this.logger.log(`MongoDB Attendance Query: ${JSON.stringify(query)}`);

      const attendance = await this.attendanceModel.find(query).sort({ date: -1 }).exec();
      
      this.logger.log(`Found ${attendance.length} attendance records for employee ${actualEmployeeId.toHexString()}`);
      return attendance;

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Get attendance failed for ID ${incomingIdFromController}:`, error.message, error.stack);
      throw new Error('Internal server error while fetching attendance.');
    }
  }

async getRoleBasedAttendance(
  user: any,
  startDate?: string,
  endDate?: string,
): Promise<any[]> {
  const userId = user._id;
  const userRole = user.role;
  const tenantId = user.tenantId;

  this.logger.log(`Initiating role-based attendance fetch for userId: ${userId}, role: ${userRole}`);

  if (!Types.ObjectId.isValid(userId)) {
    this.logger.warn(`Invalid user ID format received: ${userId}`);
    throw new BadRequestException('Invalid user ID format');
  }

  let employeeIdsToQuery: Types.ObjectId[] = [];
  let currentEmployeeId: Types.ObjectId | null = null;

  // --- Handle Admin Role First ---
  if (userRole === 'company_admin') {
    this.logger.log(`User is an admin. Fetching attendance for all employees within tenant: ${tenantId}`);
    if (!tenantId) {
      this.logger.error(`Admin user ${userId} does not have a tenantId. Cannot fetch tenant-specific attendance.`);
      throw new BadRequestException('Admin user is missing tenant information.');
    }
    
    const allTenantEmployees = await this.employeeModel.find({ tenantId: new Types.ObjectId(tenantId), employmentStatus: 'ACTIVE' })
      .select('_id userId profilePicture')
      .populate({
        path: 'userId',
        model: 'User',
        select: 'firstName lastName'
      })
      .exec();

    employeeIdsToQuery = allTenantEmployees.map(employee => employee._id);
    this.logger.log(`Found ${employeeIdsToQuery.length} employees for tenantId: ${tenantId}.`);
  } else {
    const currentUserEmployee = await this.employeeModel.findOne({ userId: new Types.ObjectId(userId), employmentStatus: 'ACTIVE' })
      .select('_id profilePicture')
      .exec();

    if (!currentUserEmployee) {
      this.logger.warn(`No employee record found for userId: ${userId}. User may not be an employee or record is missing.`);
      return [];
    }
    currentEmployeeId = currentUserEmployee._id;
 
    switch (userRole) {
      case 'employee':
        this.logger.log(`Role: 'employee'. Checking if any employees have reportingTo field matching userId: ${userId}`);

        const teamMembers = await this.employeeModel.find({ reportingTo: new Types.ObjectId(userId), employmentStatus: 'ACTIVE' })
          .select('_id profilePicture')
          .exec();

        if (teamMembers.length > 0) {
          this.logger.log(`Found ${teamMembers.length} team members reporting to userId: ${userId}`);
          employeeIdsToQuery.push(currentEmployeeId);
          const teamMemberIds = teamMembers.map(member => member._id);
          employeeIdsToQuery.push(...teamMemberIds);
        } else {
          this.logger.log(`No team members found reporting to userId: ${userId}. Fetching only own attendance`);
          employeeIdsToQuery.push(currentEmployeeId);
        }
        break;

      default:
        this.logger.warn(`Unsupported user role: ${userRole} for userId: ${userId}. Returning empty attendance.`);
        return [];
    }
  }

  employeeIdsToQuery = [...new Set(employeeIdsToQuery.map(id => id.toHexString()))].map(id => new Types.ObjectId(id));

  if (employeeIdsToQuery.length === 0) {
    this.logger.log('No employee IDs to query after role-based determination. Returning empty attendance.');
    return [];
  }

 let effectiveStartDate: Date;
  let effectiveEndDate: Date;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      this.logger.warn(`Invalid startDate format: ${startDate}`);
      throw new BadRequestException('Invalid start date format');
    }
    if (isNaN(end.getTime())) {
      this.logger.warn(`Invalid endDate format: ${endDate}`);
      throw new BadRequestException('Invalid end date format');
    }

    effectiveStartDate = start;
     end.setUTCHours(23, 59, 59, 999);
    effectiveEndDate = end;

    this.logger.log(`Using provided date range: ${effectiveStartDate.toISOString()} to ${effectiveEndDate.toISOString()}`);

  } else {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  effectiveStartDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  effectiveEndDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  this.logger.log(
    `Defaulting to current month attendance: ${effectiveStartDate.toISOString()} to ${effectiveEndDate.toISOString()}`
  );
}

  try {
    const query: any = {
      employeeId: { $in: employeeIdsToQuery },
            date: {
        $gte: effectiveStartDate,
        $lte: effectiveEndDate,
      },
    };

    const attendance = await this.attendanceModel.find(query)
      .populate({
        path: 'employeeId',
        model: 'Employee',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'firstName lastName',
        },
        select: 'userId profilePicture'
      })
      .sort({ date: -1 })
      .exec();

    const employees = await this.employeeModel.find({ _id: { $in: employeeIdsToQuery }, employmentStatus: 'ACTIVE' })
      .select('_id profilePicture')
      .populate({
        path: 'userId',
        model: 'User',
        select: 'firstName lastName'
      })
      .exec();

    const employeeMap = new Map<string, any>();
    employees.forEach(emp => {
      employeeMap.set(emp._id.toString(), {
        _id: emp._id,
        profilePicture: emp.profilePicture,
        userId: emp.userId
      });
    });

    const groupedAttendance = this.groupAttendanceByEmployee(
      attendance,
      employeeIdsToQuery,
      userRole !== 'company_admin' ? currentEmployeeId : null,
      employeeMap
    );

    return groupedAttendance;

  } catch (error) {
    this.logger.error(`Error querying attendance records:`, error.message, error.stack);
    throw new Error('Internal server error while fetching attendance records.');
  }
}

// Update the groupAttendanceByEmployee method to accept employeeMap
private groupAttendanceByEmployee(
  attendanceRecords: any[],
  employeeIdsToQuery: Types.ObjectId[],
  currentEmployeeId?: Types.ObjectId | null,
  employeeMap?: Map<string, any>
): any[] {
  const groupedMap = new Map<string, any>();

  for (const empId of employeeIdsToQuery) {
    const empIdStr = empId.toHexString();
    const isCurrentUser = currentEmployeeId ? empId.equals(currentEmployeeId) : false;
    
    // Get employee info from the map if available
    const employeeInfo = employeeMap?.get(empIdStr) || { 
      _id: empId,
      profilePicture: null,
      userId: null 
    };

    groupedMap.set(empIdStr, {
      employeeId: empIdStr,
      employeeInfo: {
        _id: empIdStr,
        profilePicture: employeeInfo.profilePicture, // Include profile picture
        userId: employeeInfo.userId
      },
      isCurrentUser,
      attendanceType: isCurrentUser ? 'myAttendance' : 'teamMemberAttendance',
      attendance: [],
      monthlyStats: {},
    });
  }

  attendanceRecords.forEach(record => {
    const empId = record.employeeId._id.toHexString();
    if (groupedMap.has(empId)) {
      const group = groupedMap.get(empId);
      group.attendance.push(record);
    }
  });

  const groupedData = Array.from(groupedMap.values());

  groupedData.forEach(group => {
    group.monthlyStats = this.calculateMonthlyStats(group.attendance);
    
    // Format employee name if userId is available
    if (group.employeeInfo && group.employeeInfo.userId) {
      const userDoc = group.employeeInfo.userId;
      group.employeeInfo.name = `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim();
    } else {
      group.employeeInfo.name = 'N/A';
    }
  });

  return groupedData;
}



  /**
   * Determine attendance status based on check-in/out times and remarks
   */
  private determineStatus(record: any, checkInTime: Date | null, checkOutTime: Date | null): string {
    if (!checkInTime) return 'absent'; // Explicitly set absent if no check-in

    // Define standard work hours (e.g., 9:00 AM to 5:30 PM)
    const standardCheckInHour = 9;
    const standardCheckInMinute = 0; // Assuming 9:00 AM is on-time start
    const standardGracePeriodMinutes = 30; // 30 minutes grace period, so late after 9:30 AM
    
    const standardCheckOutHour = 17;
    const standardCheckOutMinute = 30; // Assuming 5:30 PM is standard end

    const checkInHour = checkInTime.getHours();
    const checkInMinute = checkInTime.getMinutes();
    const checkOutHour = checkOutTime?.getHours() || standardCheckOutHour; // Default to standard if no checkout
    const checkOutMinute = checkOutTime?.getMinutes() || standardCheckOutMinute; // Default to standard if no checkout

    // Calculate effective check-in threshold (e.g., 9:30 AM)
    const lateCheckInThresholdHour = standardCheckInHour;
    const lateCheckInThresholdMinute = standardCheckInMinute + standardGracePeriodMinutes;

    // Check if late
    const isLate = checkInHour > lateCheckInThresholdHour || 
                   (checkInHour === lateCheckInThresholdHour && checkInMinute > lateCheckInThresholdMinute);

    // Check if overtime
    const isOvertime = checkOutTime && (checkOutHour > standardCheckOutHour || 
                                       (checkOutHour === standardCheckOutHour && checkOutMinute > standardCheckOutMinute));

    // Check remarks for additional context (case-insensitive)
    const remarks = record.remarks?.toLowerCase() || '';
    const hasOvertimeRemark = remarks.includes('overtime') || remarks.includes('extended');
    const hasLateRemark = remarks.includes('late') || remarks.includes('very late');

    // Determine status hierarchy: Late-Overtime > Late > Present-Overtime > Present > Absent
    if ((isLate || hasLateRemark) && (isOvertime || hasOvertimeRemark)) {
      return 'late-overtime';
    } else if (isLate || hasLateRemark) {
      return 'late';
    } else if (isOvertime || hasOvertimeRemark) {
      return 'present-overtime';
    } else {
      // If checked in and not late, not overtime, it's a regular present day
      return 'present';
    }
  }


  /**
   * Calculate monthly statistics
   */
  private calculateMonthlyStats(rawData: any[]): any {
    // Ensure rawData only contains actual attendance records, not 'absent' placeholders
    const presentRecords = rawData.filter(record => record.checkInTime); // Filter for records with a check-in time

    const totalDays = rawData.length; // Total days in the period (including calculated absent)
    const presentDays = presentRecords.length;
    const absentDays = totalDays - presentDays; // Absent days are total days minus present days

    const lateDays = presentRecords.filter(record => {
      // Re-evaluate status based on the determineStatus logic or direct time comparison
      const checkIn = record.checkInTime ? new Date(record.checkInTime) : null;
      if (!checkIn) return false;

      const standardCheckInHour = 9;
      const standardCheckInMinute = 0;
      const standardGracePeriodMinutes = 30;

      const lateCheckInThresholdHour = standardCheckInHour;
      const lateCheckInThresholdMinute = standardCheckInMinute + standardGracePeriodMinutes;

      const isLate = checkIn.getHours() > lateCheckInThresholdHour || 
                     (checkIn.getHours() === lateCheckInThresholdHour && checkIn.getMinutes() > lateCheckInThresholdMinute);
      
      const remarks = record.remarks?.toLowerCase() || '';
      const hasLateRemark = remarks.includes('late') || remarks.includes('very late');
      
      return isLate || hasLateRemark;
    }).length;

    const overtimeDays = presentRecords.filter(record => {
      const checkOut = record.checkOutTime ? new Date(record.checkOutTime) : null;
      if (!checkOut) return false;

      const standardCheckOutHour = 17;
      const standardCheckOutMinute = 30;

      const isOvertime = checkOut.getHours() > standardCheckOutHour || 
                         (checkOut.getHours() === standardCheckOutHour && checkOut.getMinutes() > standardCheckOutMinute);
      
      const remarks = record.remarks?.toLowerCase() || '';
      const hasOvertimeRemark = remarks.includes('overtime') || remarks.includes('extended');

      return isOvertime || hasOvertimeRemark;
    }).length;

    // Calculate total hours - sum `totalHours` from records if available, otherwise calculate from check-in/out
    const totalHours = presentRecords.reduce((sum, record) => {
      if (record.totalHours !== undefined && record.totalHours !== null) {
        return sum + record.totalHours;
      }
      // If totalHours is not pre-calculated, calculate from checkIn/Out
      if (record.checkInTime && record.checkOutTime) {
        const checkIn = new Date(record.checkInTime);
        const checkOut = new Date(record.checkOutTime);
        const diffMs = checkOut.getTime() - checkIn.getTime();
        return sum + (diffMs / (1000 * 60 * 60)); // Convert milliseconds to hours
      }
      return sum;
    }, 0);

    const validCheckIns = presentRecords.filter(r => r.checkInTime);
    const validCheckOuts = presentRecords.filter(r => r.checkOutTime);

    const avgCheckIn = validCheckIns.length > 0
      ? this.calculateAverageTime(validCheckIns.map(r => new Date(r.checkInTime)))
      : '--:--';

    const avgCheckOut = validCheckOuts.length > 0
      ? this.calculateAverageTime(validCheckOuts.map(r => new Date(r.checkOutTime)))
      : '--:--';

    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      overtimeDays,
      totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
      avgCheckIn,
      avgCheckOut,
      attendanceRate,
      averageHoursPerDay: presentDays > 0 ? Math.round((totalHours / presentDays) * 100) / 100 : 0,
      onTimeDays: presentDays - lateDays,
      regularDays: presentDays - overtimeDays, // Days that are present and not overtime
    };
  }

  /**
   * Format time to HH:MM format
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get day name from day number
   */
  private getDayName(dayNumber: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNumber];
  }

  /**
   * Calculate average time from array of dates
   */
  private calculateAverageTime(dates: Date[]): string {
    if (dates.length === 0) return '--:--';

    const totalMinutes = dates.reduce((sum, date) => {
      return sum + (date.getHours() * 60 + date.getMinutes());
    }, 0);

    const avgMinutes = Math.round(totalMinutes / dates.length);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }



  // Get today's attendance for an employee
  async getTodayAttendance(employeeId: string): Promise<Attendance | null> {
    try {
      if (!Types.ObjectId.isValid(employeeId)) {
        throw new BadRequestException('Invalid employee ID format');
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      const attendance = await this.attendanceModel.findOne({
        employeeId: new Types.ObjectId(employeeId),
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      return attendance;
    } catch (error) {
      this.logger.error(`Get today attendance failed for employee ${employeeId}:`, error.message);
      throw error;
    }
  }

  // Helper method to calculate total hours
  private calculateTotalHours(checkInTime: Date, checkOutTime: Date): number {
    const diffInMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = diffInMs / (1000 * 60 * 60); // Convert to hours
    return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
  }

  // Create attendance manually (for admin use)
  async create(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    try {
      this.logger.log('Creating manual attendance record');
      
      const attendanceData = {
        ...createAttendanceDto,
        employeeId: new Types.ObjectId(createAttendanceDto.employeeId),
        date: new Date(),
        checkInTime: createAttendanceDto.checkInTime ? new Date(createAttendanceDto.checkInTime) : new Date(),
      };

      const newAttendance = new this.attendanceModel(attendanceData);
      return await newAttendance.save();
    } catch (error) {
      this.logger.error('Create attendance failed:', error.message);
      throw error;
    }
  }

  // Update attendance (for admin use)
  async update(id: string, updateAttendanceDto: UpdateAttendanceDto): Promise<Attendance> {
    try {
      this.logger.log(`Updating attendance record: ${id}`);

      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid attendance ID format');
      }

      const updatedAttendance = await this.attendanceModel.findByIdAndUpdate(
        id,
        updateAttendanceDto,
        { new: true },
      );

      if (!updatedAttendance) {
        throw new NotFoundException('Attendance record not found');
      }

      return updatedAttendance;
    } catch (error) {
      this.logger.error(`Update attendance failed for ID ${id}:`, error.message);
      throw error;
    }
  }

  // Delete attendance (for admin use)
  async remove(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting attendance record: ${id}`);

      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid attendance ID format');
      }

      const result = await this.attendanceModel.findByIdAndDelete(id);
      
      if (!result) {
        throw new NotFoundException('Attendance record not found');
      }

      this.logger.log(`Attendance record deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Delete attendance failed for ID ${id}:`, error.message);
      throw error;
    }
  }

  async markAbsentForLeave(employeeId: string, dates: Date[]): Promise<void> {
    try {
      const attendanceRecords = await this.attendanceModel.find({
        employeeId: new Types.ObjectId(employeeId),
        date: { $in: dates },
      }).exec();

      const existingDates = attendanceRecords.map((rec) => rec.date.toDateString());

      const newAbsentRecords = dates
        .filter((date) => !existingDates.includes(date.toDateString()))
        .map((date) => ({
          employeeId: new Types.ObjectId(employeeId),
          date,
          checkInTime: null,
          checkOutTime: null,
          totalHours: 0,
          status: 'Leave',
          isAutoCheckout: false,
        }));

      if (newAbsentRecords.length > 0) {
        await this.attendanceModel.insertMany(newAbsentRecords);
      }
    } catch (error) {
      this.logger.error('Failed to mark absent for leave:', error.message);
      throw error;
    }
  }

  async attendanceReport(tenantId: string) {
    try {
      // 1. Get all employees of this tenant
      const employees = await this.employeeModel.find({
        tenantId: new Types.ObjectId(tenantId)
      }).select('_id').lean();

      const totalEmployees = employees.length;
      if (totalEmployees === 0) {
        return {
          totalEmployees: 0,
          presentToday: 0,
          absentToday: 0,
          todayAttendanceRate: 0,
          MTDAttendanceRate: 0
        };
      }

      const employeeIds = employees.map(emp => emp._id);

      // 2. Today's date range
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 3. Get today's attendance
      const todayAttendance = await this.attendanceModel.find({
        employeeId: { $in: employeeIds },
        date: { $gte: todayStart, $lte: todayEnd }
      }).lean();

      const presentToday = todayAttendance.filter(a => a.status?.toLowerCase() === 'present').length;
      const absentToday = totalEmployees - presentToday;
      const todayAttendanceRate = ((presentToday / totalEmployees) * 100).toFixed(2);

      // 4. MTD Attendance Rate
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const mtdAttendance = await this.attendanceModel.find({
        employeeId: { $in: employeeIds },
        date: { $gte: monthStart, $lte: todayEnd }
      }).lean();

      // Calculate MTD rate = (total presents in month) / (total employees × days till now) × 100
      const daysTillNow = now.getDate();
      const totalPossibleAttendances = totalEmployees * daysTillNow;
      const mtdPresentCount = mtdAttendance.filter(a => a.status?.toLowerCase() === 'present').length;
      const mtdAttendanceRate = ((mtdPresentCount / totalPossibleAttendances) * 100).toFixed(2);

          // Monthly trends function call
      const monthlyAttendanceTrands = await this.getMonthlyAttendanceTrends(tenantId);
      const departmentWiseAttendance = await this.getDepartmentWiseAttendance(tenantId, new Date());
      const currentMonthLateCheckIns = await this.getCurrentMonthLateCheckIns(tenantId);
      const recentCorrectionAttendanceRequests = await this.getRecentCorrectionAttendanceRequests(tenantId);
      const todayLeaveRequests = await this.getTodayLeaveRequests(tenantId);

      return {
        totalEmployees,
        presentToday,
        absentToday,
        todayAttendanceRate: Number(todayAttendanceRate),
        MTDAttendanceRate: Number(mtdAttendanceRate),
        monthlyAttendanceTrands,
        departmentWiseAttendance,
        currentMonthLateCheckIns,
        recentCorrectionAttendanceRequests,
        todayLeaveRequests
      };

    } catch (error) {
      this.logger.error(`Error generating attendance report: ${error.message}`, error.stack);
      throw new Error('Internal server error while generating attendance report.');
    }
  }

  private async getMonthlyAttendanceTrends(tenantId: string) {
    const employees = await this.employeeModel.find({
      tenantId: new Types.ObjectId(tenantId)
    }).select('_id').lean();

    const totalEmployees = employees.length;
    if (totalEmployees === 0) return [];

    const employeeIds = employees.map(emp => emp._id);

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const attendanceRecords = await this.attendanceModel.find({
      employeeId: { $in: employeeIds },
      date: { $gte: monthStart, $lte: monthEnd }
    }).lean();

    const trends: { date: string; attendancePercent: number }[] = [];

    for (
      let d = new Date(monthStart);
      d <= monthEnd;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0]; // pure UTC date string

      const dayRecords = attendanceRecords.filter(a => {
        const recDate = new Date(a.date);
        const recDateStr = new Date(Date.UTC(recDate.getUTCFullYear(), recDate.getUTCMonth(), recDate.getUTCDate()))
          .toISOString()
          .split('T')[0];
        return recDateStr === dateStr;
      });

      const presentCount = dayRecords.filter(a => a.status?.toLowerCase() === 'present').length;
      const attendancePercent = totalEmployees > 0
        ? Math.round((presentCount / totalEmployees) * 100)
        : 0;

      trends.push({ date: dateStr, attendancePercent });
    }

    return trends;
  }

  private async getDepartmentWiseAttendance(tenantId: string, targetDate: Date) {
    if (!tenantId || !Types.ObjectId.isValid(tenantId)) {
      throw new HttpException('Invalid tenant ID', HttpStatus.BAD_REQUEST);
    }

    const startOfDay = new Date(Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate()
    ));
    const endOfDay = new Date(Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      23, 59, 59, 999
    ));

    // ✅ Raw attendance without tenantId filter (since tenantId is in employee)
    const rawAttendance = await this.attendanceModel.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    // ✅ Aggregate marked attendance with tenantId filter after employee lookup
    const markedAttendance = await this.attendanceModel.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: { path: "$employee", preserveNullAndEmptyArrays: false } },
      {
        $match: {
          "employee.tenantId": new Types.ObjectId(tenantId)
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "employee.departmentId",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$department.departmentName",
          presentToday: {
            $sum: {
              $cond: [
                { $eq: [{ $toLower: "$status" }, "present"] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // ✅ Get total employees per department for that tenant
    const employeesByDept = await this.employeeModel.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId) } },
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$department.departmentName",
          totalEmployees: { $sum: 1 }
        }
      }
    ]);

    // ✅ Merge attendance with total employees
    const deptWiseAttendance = employeesByDept.map(dept => {
      const attendance = markedAttendance.find(m => m._id === dept._id) || { presentToday: 0 };
      const absentToday = dept.totalEmployees - attendance.presentToday;
      const attendanceRate = dept.totalEmployees > 0
        ? parseFloat(((attendance.presentToday / dept.totalEmployees) * 100).toFixed(2))
        : 0;

      return {
        department: dept._id,
        totalEmployees: dept.totalEmployees,
        presentToday: attendance.presentToday,
        absentToday,
        attendanceRate
      };
    });

    return deptWiseAttendance;
  }

  private async getCurrentMonthLateCheckIns(tenantId: string): Promise<any[]> {
    if (!tenantId || !Types.ObjectId.isValid(tenantId)) {
      throw new HttpException('Invalid tenant ID', HttpStatus.BAD_REQUEST);
    }

    const matchingEmployee = await this.employeeModel.findOne({
      tenantId: new Types.ObjectId(tenantId)
    }).lean();

    if (!matchingEmployee) {
      throw new HttpException('No employee found for given tenant ID', HttpStatus.NOT_FOUND);
    }

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const lateCheckIns = await this.attendanceModel.aggregate([
      {
        $match: {
          employeeId: matchingEmployee._id,
          checkInTime: { $ne: null },
          date: { $gte: monthStart, $lte: monthEnd },
          $expr: {
            $gt: [
              { $hour: { date: "$checkInTime", timezone: "Asia/Karachi" } },
              9
            ]
          }
        }
      },
      {
        $match: {
          $or: [
            { $expr: { $gt: [{ $hour: { date: "$checkInTime", timezone: "Asia/Karachi" } }, 9] } },
            {
              $and: [
                { $expr: { $eq: [{ $hour: { date: "$checkInTime", timezone: "Asia/Karachi" } }, 9] } },
                { $expr: { $gt: [{ $minute: { date: "$checkInTime", timezone: "Asia/Karachi" } }, 30] } }
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
          as: 'employeeData'
        }
      },
      { $unwind: "$employeeData" },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeData.userId',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: "$userData" },
      {
        $lookup: {
          from: 'departments',
          localField: 'employeeData.departmentId',
          foreignField: '_id',
          as: 'departmentData'
        }
      },
      { $unwind: { path: "$departmentData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'designations',
          localField: 'employeeData.positionId',
          foreignField: '_id',
          as: 'designationData'
        }
      },
      { $unwind: { path: "$designationData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeData.reportingTo',
          foreignField: '_id',
          as: 'reportingToData'
        }
      },
      { $unwind: { path: "$reportingToData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          name: { $concat: ["$userData.firstName", " ", "$userData.lastName"] },
          department: "$departmentData.departmentName",
          checkInTime: {
            $dateToString: { format: "%H:%M", date: "$checkInTime", timezone: "Asia/Karachi" }
          },
          designation: "$designationData.designationName",
          reportingTo: {
            $cond: {
              if: { $ifNull: ["$reportingToData.firstName", false] },
              then: { $concat: ["$reportingToData.firstName", " ", "$reportingToData.lastName"] },
              else: null
            }
          }
        }
      }
    ]);
    return lateCheckIns;
  }

  private async getRecentCorrectionAttendanceRequests(tenantId: string): Promise<any[]> {
    if (!tenantId || !Types.ObjectId.isValid(tenantId)) {
      throw new HttpException('Invalid tenant ID', HttpStatus.BAD_REQUEST);
    }

    const records = await this.RequestMangmentModel.find({
      type: "attendance",
      "workflow.status": "pending"
    })
      .populate({
        path: 'employeeId',
        model: 'Employee',
        select: 'tenantId userId reportingTo positionId departmentId',
        populate: [
          { path: 'userId', model: 'User', select: 'firstName lastName' },
          { path: 'reportingTo', model: 'User', select: 'firstName lastName' },
          { path: 'positionId', model: 'Designation', select: 'title' },
          { path: 'departmentId', model: 'Department', select: 'departmentName' },
        ],
      })
      .lean()
      .exec();

    // Filter by tenantId (from employeeId)
    const filtered = records.filter(r => {
      const emp: any = r.employeeId;
      return emp?.tenantId?.toString() === tenantId.toString();
    });

    // Format output
    const formatted = filtered.map(r => {
      const emp: any = r.employeeId;
      const user = emp?.userId;

      return {
        date: r.appliedDate,
        employeeName: user
          ? `${user.firstName} ${user.lastName}`
          : null,
        checkIn: r.attendanceDetails?.checkInTime || "--:--",
        checkOut: r.attendanceDetails?.checkOutTime || "--:--",
        reason: r.attendanceDetails?.reason || ""
      };
    });

    return formatted;
  }

  private async getTodayLeaveRequests(tenantId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const requests = await this.RequestMangmentModel.aggregate([
      {
        $match: {
          type: "leave",
          "leaveDetails.from": { $lte: todayEnd },
          "leaveDetails.to": { $gte: todayStart },
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $match: {
          "employee.tenantId": new mongoose.Types.ObjectId(tenantId)
        }
      },

      {
        $lookup: {
          from: "users",
          localField: "employee.userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Lookup department info
      {
        $lookup: {
          from: "departments",
          localField: "employee.departmentId",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "designations",
          localField: "employee.positionId",
          foreignField: "_id",
          as: "designation"
        }
      },
      { $unwind: { path: "$designation", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 0,
          name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          profilePicture: "$employee.profilePicture",
          department: "$department.departmentName",
          designation: "$designation.title",
          leaveType: {
            $concat: [
              { $toUpper: { $substrCP: ["$leaveDetails.leaveType", 0, 1] } },
              { $substrCP: ["$leaveDetails.leaveType", 1, { $strLenCP: "$leaveDetails.leaveType" }] },
              " Leave"
            ]
          }
        }
      }
    ]);

    return requests;
  }
}