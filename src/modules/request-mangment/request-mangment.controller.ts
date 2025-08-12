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
  HttpException,
} from '@nestjs/common';
import { requestMangmentervice } from './request-mangment.service';
import { CreateRequestMangmentDto, RequestStatus } from './dto/create-request-mangment.dto';
import { UpdateRequestMangmentDto } from './dto/update-request-mangment.dto';
import { plainToClass } from 'class-transformer';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { User } from '../tenant/users/schemas/user.schema';
import { RequestMangmentResponseDto } from './dto/requestMangmentresponse-dto';
import { GetRequestDto } from './dto/get-request-mangment.dto';

@Controller('requestMangment')
@UseGuards()
export class RequestMangmentController {
  constructor(private readonly requestMangmentervice: requestMangmentervice) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() createRequestMangmentDto: CreateRequestMangmentDto
  ) {
    if (user.role === 'company_admin' && user.role === 'super_admin') {
      createRequestMangmentDto.employeeId = user._id.toString();
    }
    const RequestMangment = await this.requestMangmentervice.create(
    createRequestMangmentDto,
    user
    );
  }

  @Get()
  async getrequestMangment(
    @CurrentUser() user: User,
    @Query() getDto: GetRequestDto,
  ) {
    const {
      myRequests,
      teamRequests,
      summary,
    } = await this.requestMangmentervice.getRoleBasedrequestMangment(user, getDto);

    return {
      success: true,
      list: {
        myRequests,
        teamRequests,
      },
      count: summary.totalRequests,
      summary,
    };
  }

  @Get('report')
  async getLeaveReport(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('month') month?: string
  ) {
    return this.requestMangmentervice.getCurrentMonthLeaveReport(
      user?.tenantId.toString(),
      from,
      to,
      month
    );
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateRequestMangmentDto: UpdateRequestMangmentDto,
  ): Promise<RequestMangmentResponseDto> {
    const RequestMangment = await this.requestMangmentervice.update(
      id,
      updateRequestMangmentDto,
      user
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
      RequestStatus.APPROVED, // Using enum here
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
      RequestStatus.REJECTED, // Using enum here
      user.firstName + ' ' + user.lastName,
      rejectionReason,
    );
    return plainToClass(RequestMangmentResponseDto, RequestMangment, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: User,
    @Param('id') id: string
  ) {
    await this.requestMangmentervice.remove(id, user);
  }
}