import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Logger, Query, HttpCode, BadRequestException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-Employee.dto';
import { UpdateEmployeeDto } from './dto/update-Employee.dto';
import { GetEmployeeDto } from './dto/get-Employee.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { User, UserRole, UserSchema } from '../tenant/users/schemas/user.schema';
import { Public } from '@/common/decorators/public.decorator';
@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  constructor(private readonly employeesService: EmployeesService) { }

  @Post()
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @CurrentUser() user: User) {
    try {
      if (!user.tenantId) {
        throw new HttpException('Your account has no tenant association',
          HttpStatus.FORBIDDEN
        );
      }

      const dob = new Date(createEmployeeDto.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      if (age < 18) {
        throw new HttpException(
          'Employee must be at least 18 years old',
          HttpStatus.BAD_REQUEST
        );
      }

      createEmployeeDto.tenantId = new Types.ObjectId(user.tenantId);

      return await this.employeesService.create(createEmployeeDto);
    } catch (error) {
      throw new HttpException(
        {
          status: error.status || HttpStatus.BAD_REQUEST,
          error: error.message.includes('duplicate')
            ? 'Employee already exists'
            : 'Creation failed',
          message: error.message,
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll(@CurrentUser() user: User, @Query() getDto: GetEmployeeDto) {
    try {
      if (user.role !== UserRole.SUPER_ADMIN) {
        if (!user.tenantId) {
          throw new HttpException(
            'User does not have tenant access',
            HttpStatus.FORBIDDEN
          );
        }
        getDto.tenantId = new Types.ObjectId(user.tenantId);
      }

      return this.employeesService.findAll(getDto);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch employees',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string): Promise<GetEmployeeDto> {
    try {
      this.logger.log(`Fetching employee with userId: ${userId}`);
      const employee = await this.employeesService.findByUserId(userId);
      if (!employee) {
        this.logger.warn(`Employee with userId ${userId} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Employee not found',
            message: `Employee with userId ${userId} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Employee with userId ${userId} retrieved successfully`);
      return employee;
    } catch (error) {
      this.logger.error(`Failed to fetch employee with userId ${userId}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch employee',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('emp/:userId')
  async findEmployeeIdByUserId(@Param('userId') userId: string): Promise<{ employeeId: string }> {
    try {
      this.logger.log(`Fetching employee ID with userId: ${userId}`);
      const employeeId = await this.employeesService.findEmployeeIdByUserId(userId);
      if (!employeeId) {
        this.logger.warn(`Employee with userId ${userId} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Employee not found',
            message: `Employee with userId ${userId} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Employee ID for userId ${userId} retrieved successfully`);
      return { employeeId };
    } catch (error) {
      this.logger.error(`Failed to fetch employee ID with userId ${userId}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch employee ID',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('report')
  async getEmployeeReport(@CurrentUser() user: User) {
    try {
      if (!user.tenantId) {
        throw new HttpException(
          'User does not have tenant access',
          HttpStatus.FORBIDDEN
        );
      }

      this.logger.log(`🔍 Generating employee report for tenant: ${user.tenantId}`);

      const report = await this.employeesService.generateEmployeeReport(
        user.tenantId.toString()
      );

      return {
        success: true,
        data: report,
        message: 'Employee report generated successfully'
      };
    } catch (error) {
      this.logger.error(`❌ Report generation failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate employee report',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GetEmployeeDto> {
    try {
      this.logger.log(`Fetching employee with ID: ${id}`);
      const employee = await this.employeesService.findOne(id);
      if (!employee) {
        this.logger.warn(`Employee with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Employee not found',
            message: `Employee with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Employee with ID ${id} retrieved successfully`);
      return employee;
    } catch (error) {
      this.logger.error(`Failed to fetch employee with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch employee',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @ApiBody({ type: UpdateEmployeeDto })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto
  ): Promise<GetEmployeeDto> {
    try {
      this.logger.log(`Updating employee with ID: ${id}`);
      const updatedEmployee = await this.employeesService.update(id, updateEmployeeDto);
      if (!updatedEmployee) {
        this.logger.warn(`Employee with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Employee not found',
            message: `Employee with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Employee with ID ${id} updated successfully`);
      return updatedEmployee;
    } catch (error) {
      this.logger.error(`Failed to update employee with ID ${id}: ${error.message}`, error.stack);
      const status = error.message.includes('duplicate')
        ? HttpStatus.CONFLICT
        : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        {
          status,
          error: status === HttpStatus.CONFLICT
            ? 'Employee with userId already exists'
            : 'Failed to update employee',
          message: error.message,
        },
        status,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Deleting employee with ID: ${id}`);
      const deletedEmployee = await this.employeesService.remove(id);
      if (!deletedEmployee) {
        this.logger.warn(`Employee with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Employee not found',
            message: `Employee with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Employee with ID ${id} deleted successfully`);
      return { message: `Employee with ID ${id} deleted successfully` };
    } catch (error) {
      this.logger.error(`Failed to delete employee with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to delete employee',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
@Public()
  @Get(':id/details')
  async getEmployeeDetails(
    @Param('id') id: string
  ): Promise<any> {
    // return this.employeesService.getEmployeeFullDetails(id);
  }

}