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
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const groupedData = await this.leaveRequestService.getRoleBasedLeaveRequests(
        user,
        status,
        startDate,
        endDate
      );

      const myLeaveRequests = groupedData.find(g => g.isCurrentUser);
      const teamLeaveRequests = groupedData.filter(g => !g.isCurrentUser);

      return {
        success: true,
        data: {
          myLeaveRequests,
          teamLeaveRequests,
        },
        count: groupedData.reduce((sum, group) => sum + group.count, 0)
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
    @Body('comment') comment?: string,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.changeStatus(
      id,
      status,
      comment,
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