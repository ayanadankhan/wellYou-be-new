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
  HttpException,
} from '@nestjs/common';
import { LeaveTypeService } from './leave-type.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { LeaveTypeResponseDto } from './dto/leaveTyperesponse-dto'; // Adjust import path as needed
import { LeaveTypeDocument } from './entities/leave-type.entity'; // Adjust import path as
import { plainToClass } from 'class-transformer'; // for transforming entities to DTOs
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { GetLeaveTypeDto } from './dto/get-leave-type.dto';
@Controller('leaveTypes')

export class LeaveTypeController {
  constructor(private readonly leaveTypeService: LeaveTypeService) {}

  @Post()
  async create(@Body() createLeaveTypeDto: CreateLeaveTypeDto , @CurrentUser() user: AuthenticatedUser): Promise<LeaveTypeDocument> {
    if (!user) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    const leaveType = await this.leaveTypeService.create(createLeaveTypeDto , user);
    return leaveType
  }

  @Get()
  findAll(@Query() getDto: GetLeaveTypeDto , @CurrentUser() user : AuthenticatedUser) {
    return this.leaveTypeService.findAll(getDto, user);
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