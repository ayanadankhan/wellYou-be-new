import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequestResponseDto } from './dto/leaveRequestresponse-dto';
import { plainToClass } from 'class-transformer';
import { ConflictException, NotFoundException } from '@nestjs/common';

@Controller('leaveRequests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  async create(@Body() createLeaveRequestDto: CreateLeaveRequestDto): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.create(createLeaveRequestDto);
    return plainToClass(LeaveRequestResponseDto, leaveRequest.toObject(), { excludeExtraneousValues: true });
  }

  @Get()
  async findAll(@Query('status') status?: string): Promise<LeaveRequestResponseDto[]> {
    let leaveRequests;
    
    if (status) {
      leaveRequests = await this.leaveRequestService.findByStatus(status);
    } else {
      leaveRequests = await this.leaveRequestService.findAll();
    }
    
    return leaveRequests.map(leaveRequest => 
      plainToClass(LeaveRequestResponseDto, leaveRequest.toObject(), { excludeExtraneousValues: true })
    );
  }

  @Get('count')
  async getCount(): Promise<{ count: number }> {
    const count = await this.leaveRequestService.count();
    return { count };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.findOne(id);
    return plainToClass(LeaveRequestResponseDto, leaveRequest.toObject(), { excludeExtraneousValues: true });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.update(id, updateLeaveRequestDto);
    return plainToClass(LeaveRequestResponseDto, leaveRequest.toObject(), { excludeExtraneousValues: true });
  }

  @Patch(':id/change-status')
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveRequestService.changeStatus(id, status);
    return plainToClass(LeaveRequestResponseDto, leaveRequest.toObject(), { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.leaveRequestService.remove(id);
  }

  // Additional endpoints specific to leave requests
  @Get('employee/:employeeId')
  async findByEmployee(@Param('employeeId') employeeId: string): Promise<LeaveRequestResponseDto[]> {
    const leaveRequests = await this.leaveRequestService.findByEmployee(employeeId);
    return leaveRequests.map(leaveRequest => 
      plainToClass(LeaveRequestResponseDto, leaveRequest.toObject(), { excludeExtraneousValues: true })
    );
  }

  @Get('date-range')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<LeaveRequestResponseDto[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const leaveRequests = await this.leaveRequestService.findByDateRange(start, end);
    return leaveRequests.map(leaveRequest => 
      plainToClass(LeaveRequestResponseDto, leaveRequest.toObject(), { excludeExtraneousValues: true })
    );
  }
}