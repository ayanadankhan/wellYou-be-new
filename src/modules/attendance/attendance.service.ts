// src/attendance/attendance.service.ts
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/Attendance.schema';
import { CreateAttendanceDto } from './dto/create-Attendance.dto';
import { UpdateAttendanceDto } from './dto/update-Attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
  ) {}

  // Check-in (Auto-called on login)
  async checkin(employeeId: string, p0: { loginTime: Date; source: string; }): Promise<Attendance> {
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

  // Get attendance by employee and date range
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







