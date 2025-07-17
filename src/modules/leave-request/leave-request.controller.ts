import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { plainToClass } from 'class-transformer';
import { Types } from 'mongoose';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { User } from '../tenant/users/schemas/user.schema';
import { LeaveRequestResponseDto } from './dto/leaveRequestresponse-dto';

@Controller('leaveRequests')
@UseGuards()
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  async create(@Body() createLeaveRequestDto: CreateLeaveRequestDto): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.create(createLeaveRequestDto);
    return plainToClass(LeaveRequestResponseDto, leaveRequest.toObject(), { excludeExtraneousValues: true });
  }

  @Get()
  async getLeaveRequests(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const groupedData = await this.leaveRequestService.getRoleBasedLeaveRequests(
        user,
        status,
        type,
        startDate,
        endDate
      );

      const myRequests = groupedData.find(g => g.isCurrentUser);
      const teamRequests = groupedData.filter(g => !g.isCurrentUser);

      return {
        success: true,
        data: {
          myRequests,
          teamRequests,
        },
        count: groupedData.reduce((sum, group) => sum + group.count, 0),
        summary: {
          totalRequests: groupedData.reduce((sum, group) => sum + group.count, 0),
          myRequestsCount: myRequests ? myRequests.count : 0,
          teamRequestsCount: teamRequests.reduce((sum, group) => sum + group.count, 0),
        }
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('stats')
  async getStats(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const allRequests = await this.leaveRequestService.getRoleBasedLeaveRequests(
        user,
        undefined,
        undefined,
        startDate,
        endDate
      );

      const stats = {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        leaveRequests: 0,
        timeOffRequests: 0,
        overtimeRequests: 0,
      };

      allRequests.forEach(group => {
        group.leaveRequests.forEach((request: any) => {
          stats.totalRequests++;
          
          // Status statistics
          if (request.workflow.status === 'pending') stats.pendingRequests++;
          else if (request.workflow.status === 'approved') stats.approvedRequests++;
          else if (request.workflow.status === 'rejected') stats.rejectedRequests++;
          
          // Type statistics
          if (request.type === 'leave') stats.leaveRequests++;
          else if (request.type === 'timeOff') stats.timeOffRequests++;
          else if (request.type === 'overtime') stats.overtimeRequests++;
        });
      });

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.findOne(id);
    return plainToClass(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.update(
      id,
      updateLeaveRequestDto,
    );
    return plainToClass(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('actionBy') actionBy?: string,
    @Body('rejectionReason') rejectionReason?: string,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.changeStatus(
      id,
      status,
      actionBy,
      rejectionReason,
    );
    return plainToClass(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('comment') comment?: string,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.changeStatus(
      id,
      'approved',
      user.firstName + ' ' + user.lastName,
      undefined,
    );
    return plainToClass(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('rejectionReason') rejectionReason: string,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.changeStatus(
      id,
      'rejected',
      user.firstName + ' ' + user.lastName,
      rejectionReason,
    );
    return plainToClass(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.leaveRequestService.remove(id);
  }
}