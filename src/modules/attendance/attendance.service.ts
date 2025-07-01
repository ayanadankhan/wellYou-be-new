// src/attendance/attendance.service.ts
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/Attendance.schema';
import { CreateAttendanceDto } from './dto/create-Attendance.dto';
import { UpdateAttendanceDto } from './dto/update-Attendance.dto';

// Assuming you have an Employee model - adjust import path as needed
import { Employee, EmployeeSchema, EmployeeDocument } from '../employees/schemas/Employee.schema';

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
  async getAttendanceByEmployee(
    employeeId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]> {
    try {
      this.logger.log(`Fetching attendance for employee: ${employeeId}`);

      if (!Types.ObjectId.isValid(employeeId)) {
        throw new BadRequestException('Invalid employee ID format');
      }

      const query: any = { employeeId: new Types.ObjectId(employeeId) };

      // Add date range filter if provided
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const attendance = await this.attendanceModel
        .find(query)
        .sort({ date: -1 })
        .exec();

      this.logger.log(`Found ${attendance.length} attendance records`);
      return attendance;
    } catch (error) {
      this.logger.error(`Get attendance failed for employee ${employeeId}:`, error.message);
      throw error;
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