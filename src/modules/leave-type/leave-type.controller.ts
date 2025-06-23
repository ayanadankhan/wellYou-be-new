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
import { LeaveTypeService } from './leave-type.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { LeaveTypeResponseDto } from './dto/leaveTyperesponse-dto'; // Adjust import path as needed
import { LeaveTypeDocument } from './entities/leave-type.entity'; // Adjust import path as
import { plainToClass } from 'class-transformer'; // for transforming entities to DTOs
import { ConflictException, NotFoundException } from '@nestjs/common';
@Controller('leaveTypes')

export class LeaveTypeController {
  constructor(private readonly leaveTypeService: LeaveTypeService) {}

  @Post()
  async create(@Body() createLeaveTypeDto: CreateLeaveTypeDto): Promise<LeaveTypeResponseDto> {
    const leaveType = await this.leaveTypeService.create(createLeaveTypeDto);
    return plainToClass(LeaveTypeResponseDto, leaveType.toObject(), { excludeExtraneousValues: true });
  }

  @Get()
  async findAll(@Query('active') active?: string): Promise<LeaveTypeResponseDto[]> {
    let leaveTypes;
    
    if (active === 'true') {
      leaveTypes = await this.leaveTypeService.findActive();
    } else {
      leaveTypes = await this.leaveTypeService.findAll();
    }
    

    return leaveTypes.map(leaveType => 
      plainToClass(LeaveTypeResponseDto, leaveType.toObject(), { excludeExtraneousValues: true })
    );
  }

  @Get('count')
  async getCount(): Promise<{ count: number }> {
    const count = await this.leaveTypeService.count();
    return { count };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LeaveTypeResponseDto> {
    const leaveType = await this.leaveTypeService.findOne(id);
    return plainToClass(LeaveTypeResponseDto, leaveType.toObject(), { excludeExtraneousValues: true });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto,
  ): Promise<LeaveTypeResponseDto> {
    const leaveType = await this.leaveTypeService.update(id, updateLeaveTypeDto);
    return plainToClass(LeaveTypeResponseDto, leaveType.toObject(), { excludeExtraneousValues: true });
  }

  @Patch(':id/toggle-active')
  async toggleActive(@Param('id') id: string): Promise<LeaveTypeResponseDto> {
    const leaveType = await this.leaveTypeService.toggleActive(id);
    return plainToClass(LeaveTypeResponseDto, leaveType.toObject(), { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.leaveTypeService.remove(id);
  }
}