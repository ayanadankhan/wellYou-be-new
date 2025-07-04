// src/attendance/attendance.service.ts
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/Attendance.schema';
import { CreateAttendanceDto } from './dto/create-Attendance.dto';
import { UpdateAttendanceDto } from './dto/update-Attendance.dto';

// Assuming you have an Employee model - adjust import path as needed
import { Employee, EmployeeSchema, EmployeeDocument } from '../employees/schemas/Employee.schema';
import { User } from '../tenant/users/schemas/user.schema';

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
    @InjectModel(Employee.name)
    private employeeModel: Model<EmployeeDocument>,
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
        
        case 'admin':
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
    managerId: string,
    employeeId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceResponse> {
    // Get manager's own attendance
    const managerAttendance = await this.getAttendanceByEmployee(managerId, startDate, endDate);
    const managerFormattedData = this.formatAttendanceData(managerAttendance);
    const managerMonthlyStats = this.calculateMonthlyStats(managerAttendance);

    // Get team members under this manager
    const teamMembers = await this.employeeModel.find({
      managerId: new Types.ObjectId(managerId),
    }).select('_id name email position');

    this.logger.log(`Found ${teamMembers.length} team members for manager: ${managerId}`);

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
    }).select('_id name email position managerId');

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
      if (employee.managerId) {
        const manager = await this.employeeModel.findById(employee.managerId).select('name email');
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

  // Calculate monthly statistics
  private calculateMonthlyStats(attendance: Attendance[]): any {
    const totalDays = attendance.length;
    const presentDays = attendance.filter(record => record.status === 'Present').length;
    const absentDays = attendance.filter(record => record.status === 'Absent').length;
    const totalHours = attendance.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const avgHoursPerDay = totalDays > 0 ? totalHours / presentDays : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      totalHours: Math.round(totalHours * 100) / 100,
      avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
      attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
    };
  }

  // Check-in (Auto-called on login)
  async checkin(employeeId: string): Promise<Attendance> {
    try {
      this.logger.log(`Processing check-in for employee: ${employeeId}`);

      // Validate ObjectId
      if (!Types.ObjectId.isValid(employeeId)) {
        throw new BadRequestException('Invalid employee ID format');
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      // Check if already checked in today
      const existingAttendance = await this.attendanceModel.findOne({
        employeeId: new Types.ObjectId(employeeId),
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (existingAttendance) {
        this.logger.warn(`Employee ${employeeId} already checked in today`);
        return existingAttendance;
      }

      // Create new attendance record
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
  async autoCheckout(): Promise<void> {
    try {
      this.logger.log('Processing auto check-out for all incomplete records');

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      // Default checkout time: 5:30 PM
      const autoCheckoutTime = new Date();
      autoCheckoutTime.setHours(17, 30, 0, 0);

      // Find all incomplete attendance records for today
      const incompleteRecords = await this.attendanceModel.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        checkOutTime: null,
      });

      this.logger.log(`Found ${incompleteRecords.length} incomplete records for auto checkout`);

      // Update each record
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
  ): Promise<Attendance[]> {
    const userId = user._id; // This is the userId of the logged-in user
    const userRole = user.role;

    this.logger.log(`Initiating role-based attendance fetch for userId: ${userId}, role: ${userRole}`);

    if (!Types.ObjectId.isValid(userId)) {
      this.logger.warn(`Invalid user ID format received: ${userId}`);
      throw new BadRequestException('Invalid user ID format');
    }

    let employeeIdsToQuery: Types.ObjectId[] = [];
    let currentEmployeeId: Types.ObjectId | null = null; // The employeeId corresponding to the current userId

    // --- Step 1: Find the current user's corresponding Employee ID ---
    // Every user, regardless of role, should ideally have an associated employee record.
    const currentUserEmployee = await this.employeeModel.findOne({ userId: new Types.ObjectId(userId) }).exec();

    if (!currentUserEmployee) {
      this.logger.warn(`No employee record found for userId: ${userId}. User may not be an employee or record is missing.`);
      return [];
    }
    currentEmployeeId = currentUserEmployee._id; // This is the employee ID of the logged-in user

    this.logger.log(`Mapped userId: ${userId} to current user's employeeId: ${currentEmployeeId.toHexString()}`);

    // --- Step 2: Determine which employee IDs to query based on role ---
    switch (userRole) {
      case 'employee':
        // Scenario 1: Employee Role - Fetch only their own record
        this.logger.log(`Role: 'employee'. Fetching attendance for own employeeId: ${currentEmployeeId.toHexString()}`);
        employeeIdsToQuery.push(currentEmployeeId);
        break;

      case 'manager':
        // Scenario 2: Manager Role - Fetch own record + team members' records
        this.logger.log(`Role: 'manager'. Fetching attendance for manager's own employeeId: ${currentEmployeeId.toHexString()}`);
        employeeIdsToQuery.push(currentEmployeeId); // Add manager's own employee ID

        // CORRECTED LINE: Find team members where managerId matches the manager's userId
        // Based on your instruction: "use this Mapped userId: 685cd556506fd3148c46e0db to current user's to find its team members"
        this.logger.log(`Searching for team members where their 'managerId' field matches the manager's userId: ${userId}`);
        const teamMembers = await this.employeeModel.find({ managerId: new Types.ObjectId(userId) }).select('_id').exec();
        
        if (teamMembers.length > 0) {
          const teamMemberIds = teamMembers.map(member => member._id);
          employeeIdsToQuery.push(...teamMemberIds); // Add all team members' employee IDs
          this.logger.log(`Found ${teamMemberIds.length} team members whose managerId is manager's userId: ${userId}. Team member IDs: [${teamMemberIds.map(id => id.toHexString()).join(', ')}]`);
        } else {
          this.logger.log(`No team members found for manager's userId: ${userId}`);
        }
        break;

      case 'admin':
        // Scenario 3: Admin Role - Fetch all employees' records
        this.logger.log(`Role: 'admin'. Fetching attendance for ALL employees.`);
        const allEmployees = await this.employeeModel.find({}).select('_id').exec();
        employeeIdsToQuery = allEmployees.map(employee => employee._id);
        this.logger.log(`Found ${employeeIdsToQuery.length} total employees.`);
        break;

      default:
        this.logger.warn(`Unsupported user role: ${userRole} for userId: ${userId}. Returning empty attendance.`);
        return []; // Or throw a specific error
    }

    // Ensure unique employee IDs in case of duplicates
    employeeIdsToQuery = [...new Set(employeeIdsToQuery.map(id => id.toHexString()))].map(id => new Types.ObjectId(id));
    this.logger.log(`Final unique employee IDs to query for attendance: [${employeeIdsToQuery.map(id => id.toHexString()).join(', ')}]`);

    if (employeeIdsToQuery.length === 0) {
      this.logger.log('No employee IDs to query after role-based determination. Returning empty attendance.');
      return [];
    }

    // --- Step 3: Determine effective date range (default to current month) ---
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
      end.setHours(23, 59, 59, 999); // Include the entire end day
      effectiveEndDate = end;

      this.logger.log(`Using provided date range: ${effectiveStartDate.toISOString()} to ${effectiveEndDate.toISOString()}`);

    } else {
      const now = new Date();
      effectiveStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      effectiveStartDate.setHours(0, 0, 0, 0);

      effectiveEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      effectiveEndDate.setHours(23, 59, 59, 999);

      this.logger.log(`Defaulting to current month attendance: ${effectiveStartDate.toISOString()} to ${effectiveEndDate.toISOString()}`);
    }

    // --- Step 4: Construct and execute the MongoDB query ---
    try {
      const query: any = {
        employeeId: { $in: employeeIdsToQuery }, // Use $in operator for multiple employee IDs
        date: {
          $gte: effectiveStartDate,
          $lte: effectiveEndDate,
        },
      };

      this.logger.log(`MongoDB Attendance Query: ${JSON.stringify(query)}`);

      const attendance = await this.attendanceModel.find(query).sort({ date: -1 }).exec();
      
      this.logger.log(`Found ${attendance.length} attendance records.`);
      return attendance;

    } catch (error) {
      this.logger.error(`Error querying attendance records for employeeIds: [${employeeIdsToQuery.map(id => id.toHexString()).join(', ')}]`, error.message, error.stack);
      throw new Error('Internal server error while fetching attendance records.');
    }
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
}