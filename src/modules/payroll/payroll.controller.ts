import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll-dto';
import { UpdatePayrollDto } from './dto/update-payroll-dto';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { User } from '../tenant/users/schemas/user.schema';
import { GetPayrollDto } from './dto/get-payroll-dto';


@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  async create(
      @Body() createPayrollDto: CreatePayrollDto,
      @CurrentUser() user: User
  ) {
      return this.payrollService.create(createPayrollDto, user);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query() getDto: GetPayrollDto
  ) {
    return this.payrollService.findAll(getDto, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePayrollDto: UpdatePayrollDto) {
    return this.payrollService.update(id, updatePayrollDto);
  }

  @Patch('status/:id')
  async updateEmployeeStatuses(
    @Param('id') id: string,
    @Body() updatedEmployees: { selectedEmployees: { employeesId: string, status: string }[] }
  ) {
    return this.payrollService.updateEmployeeStatuses(id, updatedEmployees.selectedEmployees);
  }

  @Get('employee/:employeeId') 
  async findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.payrollService.findByEmployeeId(employeeId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.payrollService.remove(id);
  }
}