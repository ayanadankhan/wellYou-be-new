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
  Patch,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AttendanceService} from './attendance.service';
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

  @Get('employee')
  async getEmployeeAttendance(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {

    try {
      const groupedData: any[] = await this.attendanceService.getRoleBasedAttendance(
        { ...(user as any), _id: (user as any)._id },
        startDate,
        endDate,
      );

      const myAttendance = groupedData.find(group => group.isCurrentUser);
      const teamAttendance = groupedData.filter(group => !group.isCurrentUser);

      const formattedMyAttendance = myAttendance ? {
        ...myAttendance,
        attendance: this.formatRawAttendanceRecords(myAttendance.attendance)
      } : [];

      const formattedTeamAttendance = teamAttendance.map(group => ({
        ...group,
        attendance: this.formatRawAttendanceRecords(group.attendance)
      }));

      const allAttendanceRecords = groupedData.flatMap((group: any) => group.attendance);

      const monthlyStats = {
        totalDays: allAttendanceRecords.length,
        presentDays: allAttendanceRecords.filter((rec: any) => rec.status === 'Present').length,
        absentDays: allAttendanceRecords.filter((rec: any) => rec.status === 'Absent').length,
      };

      return {
        success: true,
        message: 'Attendance records retrieved successfully',
        data: {
          myAttendance: formattedMyAttendance,
          teamAttendance: formattedTeamAttendance,
        },
        monthlyStats: monthlyStats,
        count: groupedData.length,
      };
    } catch (error) {
      // Re-throw BadRequestException for client-side errors, generic error for others
      throw error;
    }
  }

    private formatRawAttendanceRecords(rawData: any[]): any[] {
    interface AttendanceRecord {
      _id: string;
      employeeId: any;
      date: string | Date;
      checkInTime?: string | Date | null;
      checkOutTime?: string | Date | null;
      isAutoCheckout?: boolean;
      createdAt?: string | Date;
      updatedAt?: string | Date;
      status?: string;
      totalHours?: number;
      remarks?: string;
    }

  return (rawData as AttendanceRecord[])
    .map((record): any => {
      return {
        status: record.status || '',
        remarks: record.remarks || '',
        originalData: {
          _id: record._id,
          employeeId: record.employeeId._id.toHexString(),
          date: record.date,
          checkInTime: record.checkInTime || null,
          checkOutTime: record.checkOutTime || null,
          isAutoCheckout: record.isAutoCheckout,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        }
      };
    })
    .sort((a, b) => {
        const aDate = new Date(a.originalData.date).getTime();
        const bDate = new Date(b.originalData.date).getTime();
        return aDate - bDate;
      });
  }


  @UseGuards(JwtAuthGuard)
  @Get('today/:employeeId')
  async getTodayAttendance(
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: User,
  ) {
    
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

  @Patch(':id')
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