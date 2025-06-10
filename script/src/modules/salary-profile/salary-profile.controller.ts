import { Controller, Post, Body, Param, Patch, Get, Logger } from '@nestjs/common';
import { SalaryProfileService } from './salary-profile.service';
import { CreateSalaryProfileDto } from './dto/create-salary-profile.dto';
import { IncrementSalaryProfileDto } from './dto/increment-salary-profile.dto';

@Controller('salary-profile')
export class SalaryProfileController {
  private readonly logger = new Logger(SalaryProfileController.name);

  constructor(private readonly service: SalaryProfileService) {}

  @Post()
  async create(@Body() dto: CreateSalaryProfileDto) {
    this.logger.log('Creating salary profile');
    return this.service.create(dto);
  }

  @Patch(':employeeId/increment')
  async increment(@Param('employeeId') employeeId: string, @Body() dto: IncrementSalaryProfileDto) {
    this.logger.log(`Incrementing salary for employeeId: ${employeeId}`);
    return this.service.increment(employeeId, dto);
  }

  @Get(':employeeId')
  async get(@Param('employeeId') employeeId: string) {
    this.logger.log(`Fetching salary profile for employeeId: ${employeeId}`);
    return this.service.getProfile(employeeId);
  }
}
