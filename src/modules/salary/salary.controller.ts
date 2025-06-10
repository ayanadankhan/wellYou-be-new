import { Controller, Get, Post, Body, Param, Query, Patch, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { CreateSalaryDto, SalaryIncrementDto } from './dto/create-salary.dto';

@Controller('salary')
export class SalaryController {
  private readonly logger = new Logger(SalaryController.name);

  constructor(private readonly salaryService: SalaryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSalary(@Body() dto: CreateSalaryDto) {
    this.logger.log(`Creating salary for employee: ${dto.employeeName}`);
    return this.salaryService.createSalary(dto);
  }

  @Patch(':employeeId/increment')
  async incrementSalary(
    @Param('employeeId') employeeId: string,
    @Body() dto: SalaryIncrementDto
  ) {
    this.logger.log(`Processing salary increment for employee: ${employeeId}`);
    return this.salaryService.incrementSalary(employeeId, dto);
  }

  @Get(':employeeId')
  async getCurrentSalary(@Param('employeeId') employeeId: string) {
    return this.salaryService.getCurrentSalary(employeeId);
  }

  @Get(':employeeId/history')
  async getSalaryHistory(@Param('employeeId') employeeId: string) {
    return this.salaryService.getSalaryHistory(employeeId);
  }

  @Get()
  async getAllSalaries(
    @Query('department') department?: string,
    @Query('position') position?: string,
    @Query('employmentStatus') employmentStatus?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.salaryService.getAllSalaries({
      department,
      position,
      employmentStatus,
      search,
      page,
      limit
    });
  }

  @Patch(':employeeId/terminate')
  async terminateEmployeeSalary(
    @Param('employeeId') employeeId: string,
    @Body() body: { terminationDate: Date; reason: string; terminatedBy: string }
  ) {
    const { terminationDate, reason, terminatedBy } = body;
    return this.salaryService.terminateEmployeeSalary(employeeId, terminationDate, reason, terminatedBy);
  }
}