// src/attendance/attendance.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-Attendance.dto';
import { UpdateAttendanceDto } from './dto/update-Attendance.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.gaurd';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { User } from '../tenant/users/schemas/user.schema';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);

  constructor(private readonly attendanceService: AttendanceService) { }

  @Post('checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-in employee (auto-called on login)' })
  @ApiResponse({ status: 200, description: 'Check-in successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async checkin(@Body() body: { employeeId: string }) {
    try {
      this.logger.log(`Check-in request for employee: ${body.employeeId}`);
      const result = await this.attendanceService.checkin(body.employeeId);

      return {
        success: true,
        message: 'Check-in successful',
        data: result,
      };
    } catch (error) {
      this.logger.error('Check-in failed:', error.message);
      throw error;
    }
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-out employee (called on logout)' })
  @ApiResponse({ status: 200, description: 'Check-out successful' })
  @ApiResponse({ status: 404, description: 'No check-in record found' })
  async checkout(@Body() body: { employeeId: string }) {
    try {
      this.logger.log(`Check-out request for employee: ${body.employeeId}`);
      const result = await this.attendanceService.checkout(body.employeeId);

      return {
        success: true,
        message: 'Check-out successful',
        data: result,
      };
    } catch (error) {
      this.logger.error('Check-out failed:', error.message);
      throw error;
    }
  }

  // attendance.controller.ts - Updated method with data formatting

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get attendance records for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Attendance records retrieved successfully' })
  async getEmployeeAttendance(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      this.logger.log(`Fetching attendance for employee: ${employeeId}`);
      const rawData = await this.attendanceService.getAttendanceByEmployee(
        employeeId,
        startDate,
        endDate,
      );

      // Transform raw data to frontend-compatible format
      const formattedData = this.formatAttendanceData(rawData);

      // Calculate monthly statistics
      const monthlyStats = this.calculateMonthlyStats(rawData);

      return {
        success: true,
        message: 'Attendance records retrieved successfully',
        data: formattedData,
        monthlyStats,
        count: rawData.length,
      };
    } catch (error) {
      this.logger.error('Get employee attendance failed:', error.message);
      throw error;
    }
  }

  /**
   * Format raw attendance data for frontend components
   */
  private formatAttendanceData(rawData: any[]): any[] {
    return rawData
      .filter(record => record.status !== 'Absent') // Filter out absent days
      .map(record => {
        const date = new Date(record.date);
        const checkInTime = record.checkInTime ? new Date(record.checkInTime) : null;
        const checkOutTime = record.checkOutTime ? new Date(record.checkOutTime) : null;

        return {
          date: date.getDate(),
          day: this.getDayName(date.getDay()),
          checkIn: checkInTime ? this.formatTime(checkInTime) : '--:--',
          checkOut: checkOutTime ? this.formatTime(checkOutTime) : '--:--',
          status: this.determineStatus(record, checkInTime, checkOutTime),
          totalHours: record.totalHours || 0,
          remarks: record.remarks || '',
          originalData: {
            _id: record._id,
            employeeId: record.employeeId,
            date: record.date,
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            isAutoCheckout: record.isAutoCheckout,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          }
        };
      })
      .sort((a, b) => a.date - b.date); // Sort by date
  }

  /**
   * Determine attendance status based on check-in/out times and remarks
   */
  private determineStatus(record: any, checkInTime: Date | null, checkOutTime: Date | null): string {
    if (!checkInTime) return 'absent';

    const checkInHour = checkInTime.getHours();
    const checkInMinute = checkInTime.getMinutes();
    const checkOutHour = checkOutTime?.getHours() || 17;
    const checkOutMinute = checkOutTime?.getMinutes() || 30;

    // Check if late (after 9:30 AM)
    const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30);

    // Check if overtime (after 5:30 PM)
    const isOvertime = checkOutHour > 17 || (checkOutHour === 17 && checkOutMinute > 30);

    // Check remarks for additional context
    const remarks = record.remarks?.toLowerCase() || '';
    const hasOvertimeRemark = remarks.includes('overtime') || remarks.includes('extended');
    const hasLateRemark = remarks.includes('late') || remarks.includes('very late');

    // Determine status
    if ((isLate || hasLateRemark) && (isOvertime || hasOvertimeRemark)) {
      return 'late-overtime';
    } else if (isLate || hasLateRemark) {
      return 'late';
    } else if (isOvertime || hasOvertimeRemark) {
      return 'present-overtime';
    } else {
      return 'present';
    }
  }

  /**
   * Calculate monthly statistics
   */
  private calculateMonthlyStats(rawData: any[]): any {
    const presentRecords = rawData.filter(record => record.status === 'Present');
    const absentRecords = rawData.filter(record => record.status === 'Absent');

    const totalDays = rawData.length;
    const presentDays = presentRecords.length;
    const absentDays = absentRecords.length;

    // Count late arrivals
    const lateDays = presentRecords.filter(record => {
      if (!record.checkInTime) return false;
      const checkIn = new Date(record.checkInTime);
      const isLate = checkIn.getHours() > 9 || (checkIn.getHours() === 9 && checkIn.getMinutes() > 30);
      return isLate || record.remarks?.toLowerCase().includes('late');
    }).length;

    // Count overtime days
    const overtimeDays = presentRecords.filter(record => {
      if (!record.checkOutTime) return false;
      const checkOut = new Date(record.checkOutTime);
      const isOvertime = checkOut.getHours() > 17 || (checkOut.getHours() === 17 && checkOut.getMinutes() > 30);
      return isOvertime || record.remarks?.toLowerCase().includes('overtime');
    }).length;

    // Calculate total hours
    const totalHours = presentRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0);

    // Calculate average check-in and check-out times
    const validCheckIns = presentRecords.filter(r => r.checkInTime);
    const validCheckOuts = presentRecords.filter(r => r.checkOutTime);

    const avgCheckIn = validCheckIns.length > 0
      ? this.calculateAverageTime(validCheckIns.map(r => new Date(r.checkInTime)))
      : '--:--';

    const avgCheckOut = validCheckOuts.length > 0
      ? this.calculateAverageTime(validCheckOuts.map(r => new Date(r.checkOutTime)))
      : '--:--';

    // Calculate attendance rate
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
      // Additional stats that might be useful
      averageHoursPerDay: presentDays > 0 ? Math.round((totalHours / presentDays) * 100) / 100 : 0,
      onTimeDays: presentDays - lateDays,
      regularDays: presentDays - overtimeDays,
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
  // Import Request from express at the top of the file:
  // import { Request } from 'express';

  @UseGuards(JwtAuthGuard)
@Get('today/:employeeId')
@ApiOperation({ summary: 'Get today\'s attendance for an employee' })
@ApiParam({ name: 'employeeId', description: 'Employee ID' })
@ApiResponse({ status: 200, description: 'Today\'s attendance retrieved successfully' })
async getTodayAttendance(
  @Param('employeeId') employeeId: string,
  @CurrentUser() user: User,
) {
  console.log(`User role from token: ${user.role}`); // ✅ Log user role
  
  this.logger.log(`Decoded user object: ${JSON.stringify(user)}`); // 🔍 Full user
  this.logger.log(`User role from token: ${user.role}`); // ✅ Final role log
  
  try {
    this.logger.log(`Fetching today's attendance for employee: ${employeeId}`);
    
    const result = await this.attendanceService.getTodayAttendance(employeeId);
    
    return {
      success: true,
      message: 'Today\'s attendance retrieved successfully',
      data: result,
    };
  } catch (error) {
    this.logger.error('Get today attendance failed:', error.message);
    throw error;
  }
}
  
  @Post('auto-checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto check-out all incomplete records (for cron job)' })
  @ApiResponse({ status: 200, description: 'Auto check-out completed' })
  async autoCheckout() {
    try {
      this.logger.log('Auto check-out request received');
      await this.attendanceService.autoCheckout();

      return {
        success: true,
        message: 'Auto check-out completed successfully',
      };
    } catch (error) {
      this.logger.error('Auto check-out failed:', error.message);
      throw error;
    }
  }

  @Post('mark-absent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark absent employees (for cron job)' })
  @ApiResponse({ status: 200, description: 'Absent employees marked successfully' })
  async markAbsentEmployees(@Body() body: { employeeIds: string[] }) {
    try {
      this.logger.log('Mark absent employees request received');
      await this.attendanceService.markAbsentEmployees(body.employeeIds);

      return {
        success: true,
        message: 'Absent employees marked successfully',
      };
    } catch (error) {
      this.logger.error('Mark absent employees failed:', error.message);
      throw error;
    }
  }

  // Admin endpoints for manual attendance management
  @Post()
  @ApiOperation({ summary: 'Create attendance record manually (Admin only)' })
  @ApiResponse({ status: 201, description: 'Attendance record created successfully' })
  async create(@Body() createAttendanceDto: CreateAttendanceDto) {
    try {
      this.logger.log('Manual attendance creation request');
      const result = await this.attendanceService.create(createAttendanceDto);

      return {
        success: true,
        message: 'Attendance record created successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Create attendance failed:', error.message);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update attendance record (Admin only)' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 200, description: 'Attendance record updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    try {
      this.logger.log(`Update attendance request for ID: ${id}`);
      const result = await this.attendanceService.update(id, updateAttendanceDto);

      return {
        success: true,
        message: 'Attendance record updated successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Update attendance failed:', error.message);
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete attendance record (Admin only)' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 204, description: 'Attendance record deleted successfully' })
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Delete attendance request for ID: ${id}`);
      await this.attendanceService.remove(id);

      return {
        success: true,
        message: 'Attendance record deleted successfully',
      };
    } catch (error) {
      this.logger.error('Delete attendance failed:', error.message);
      throw error;
    }
  }
}