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
import { requestMangmentervice } from './request-mangment.service';
import { CreateRequestMangmentDto } from './dto/create-request-mangment.dto';
import { UpdateRequestMangmentDto } from './dto/update-request-mangment.dto';
import { plainToClass } from 'class-transformer';
import { Types } from 'mongoose';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { User } from '../tenant/users/schemas/user.schema';
import { RequestMangmentResponseDto } from './dto/requestMangmentresponse-dto';

@Controller('requestMangment')
@UseGuards()
export class RequestMangmentController {
  constructor(private readonly requestMangmentervice: requestMangmentervice) {}

  @Post()
  async create(@Body() createRequestMangmentDto: CreateRequestMangmentDto): Promise<RequestMangmentResponseDto> {
    const RequestMangment = await this.requestMangmentervice.create(createRequestMangmentDto);
    return plainToClass(RequestMangmentResponseDto, RequestMangment.toObject(), { excludeExtraneousValues: true });
  }

  @Get()
  async getrequestMangment(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const groupedData = await this.requestMangmentervice.getRoleBasedrequestMangment(
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
      const allRequests = await this.requestMangmentervice.getRoleBasedrequestMangment(
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
        requestMangment: 0,
        timeOffRequests: 0,
        overtimeRequests: 0,
      };

      allRequests.forEach(group => {
        group.requestMangment.forEach((request: any) => {
          stats.totalRequests++;
          
          // Status statistics
          if (request.workflow.status === 'pending') stats.pendingRequests++;
          else if (request.workflow.status === 'approved') stats.approvedRequests++;
          else if (request.workflow.status === 'rejected') stats.rejectedRequests++;
          
          // Type statistics
          if (request.type === 'leave') stats.requestMangment++;
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
  ): Promise<RequestMangmentResponseDto> {
    const RequestMangment = await this.requestMangmentervice.findOne(id);
    return plainToClass(RequestMangmentResponseDto, RequestMangment, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRequestMangmentDto: UpdateRequestMangmentDto,
  ): Promise<RequestMangmentResponseDto> {
    const RequestMangment = await this.requestMangmentervice.update(
      id,
      updateRequestMangmentDto,
    );
    return plainToClass(RequestMangmentResponseDto, RequestMangment, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('actionBy') actionBy?: string,
    @Body('rejectionReason') rejectionReason?: string,
  ): Promise<RequestMangmentResponseDto> {
    const RequestMangment = await this.requestMangmentervice.changeStatus(
      id,
      status,
      actionBy,
      rejectionReason,
    );
    return plainToClass(RequestMangmentResponseDto, RequestMangment, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('comment') comment?: string,
  ): Promise<RequestMangmentResponseDto> {
    const RequestMangment = await this.requestMangmentervice.changeStatus(
      id,
      'approved',
      user.firstName + ' ' + user.lastName,
      undefined,
    );
    return plainToClass(RequestMangmentResponseDto, RequestMangment, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('rejectionReason') rejectionReason: string,
  ): Promise<RequestMangmentResponseDto> {
    const RequestMangment = await this.requestMangmentervice.changeStatus(
      id,
      'rejected',
      user.firstName + ' ' + user.lastName,
      rejectionReason,
    );
    return plainToClass(RequestMangmentResponseDto, RequestMangment, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.requestMangmentervice.remove(id);
  }
}