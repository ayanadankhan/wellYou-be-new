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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-Attendance.dto';
import { UpdateAttendanceDto } from './dto/update-Attendance.dto';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);

  constructor(private readonly attendanceService: AttendanceService) {}

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
      const result = await this.attendanceService.getAttendanceByEmployee(
        employeeId,
        startDate,
        endDate,
      );

      return {
        success: true,
        message: 'Attendance records retrieved successfully',
        data: result,
        count: result.length,
      };
    } catch (error) {
      this.logger.error('Get employee attendance failed:', error.message);
      throw error;
    }
  }

  @Get('today/:employeeId')
  @ApiOperation({ summary: 'Get today\'s attendance for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Today\'s attendance retrieved successfully' })
  async getTodayAttendance(@Param('employeeId') employeeId: string) {
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