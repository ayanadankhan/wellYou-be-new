import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Logger, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-Employee.dto';
import { UpdateEmployeeDto } from './dto/update-Employee.dto';
import { GetEmployeeDto } from './dto/get-Employee.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { EmploymentStatus } from './dto/create-Employee.dto';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Employee created successfully.', 
    type: GetEmployeeDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data.' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Employee with userId already exists.' 
  })
  async create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<GetEmployeeDto> {
    try {
      this.logger.log(`Creating employee with userId: ${createEmployeeDto.userId}`);
      const result = await this.employeesService.create(createEmployeeDto);
      this.logger.log(`Employee created successfully with ID: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create employee: ${error.message}`, error.stack);
      const status = error.message.includes('duplicate') 
        ? HttpStatus.CONFLICT 
        : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        {
          status,
          error: status === HttpStatus.CONFLICT 
            ? 'Employee with userId already exists' 
            : 'Failed to create employee',
          message: error.message,
        },
        status,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all employees with optional filtering' })
  @ApiQuery({ 
    name: 'userId', 
    required: false, 
    type: String, 
    description: 'Filter by userId (exact match)' 
  })
  @ApiQuery({ 
    name: 'departmentId', 
    required: false, 
    type: String, 
    description: 'Filter by department ID' 
  })
  @ApiQuery({ 
    name: 'positionId', 
    required: false, 
    type: String, 
    description: 'Filter by position ID' 
  })
  @ApiQuery({ 
    name: 'reportingTo', 
    required: false, 
    type: String, 
    description: 'Filter by Reporting To ID' 
  })
  @ApiQuery({ 
    name: 'employmentStatus', 
    required: false, 
    enum: EmploymentStatus,
    description: 'Filter by employment status' 
  })
  @ApiQuery({ 
    name: 'tenantId', 
    required: false, 
    type: String, 
    description: 'Filter by tenant ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of employees.', 
    type: [GetEmployeeDto] 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error.' 
  })
  async findAll(
    @Query('userId') userId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('positionId') positionId?: string,
    @Query('reportingTo') reportingTo?: string,
    @Query('employmentStatus') employmentStatus?: EmploymentStatus,
    @Query('tenantId') tenantId?: string,
  ): Promise<GetEmployeeDto[]> {
    try {
      this.logger.log(`Fetching employees with filters: ${JSON.stringify({
        userId,
        departmentId,
        positionId,
        reportingTo,
        employmentStatus,
        tenantId
      })}`);
      
      const query = {
        ...(userId && { userId }),
        ...(departmentId && { departmentId }),
        ...(positionId && { positionId }),
        ...(reportingTo && { reportingTo }),
        ...(employmentStatus && { employmentStatus }),
        ...(tenantId && { tenantId }),
      };

      const employees = await this.employeesService.findAll(query);
      this.logger.log(`Retrieved ${employees.length} employees`);
      return employees;
    } catch (error) {
      this.logger.error(`Failed to fetch employees: ${error.message}`, error.stack);
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
  @ApiOperation({ summary: 'Retrieve an employee by userId' })
  @ApiParam({ 
    name: 'userId', 
    description: 'User ID of the employee',
    example: 'user123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Employee found.', 
    type: GetEmployeeDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Employee not found.' 
  })
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
@ApiOperation({ summary: 'Retrieve employee ID by userId' })
@ApiParam({
  name: 'userId',
  description: 'User ID of the employee',
  example: 'user123'
})
@ApiResponse({
  status: 200,
  description: 'Employee ID found.',
  schema: {
    type: 'object',
    properties: {
      employeeId: {
        type: 'string',
        example: 'emp456'
      }
    }
  }
})
@ApiResponse({
  status: 404,
  description: 'Employee not found.'
})
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

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single employee by ID' })
  @ApiParam({ 
    name: 'id', 
    description: 'MongoDB ObjectID of the employee',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Employee found.', 
    type: GetEmployeeDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Employee not found.' 
  })
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
  @ApiOperation({ summary: 'Update an employee by ID' })
  @ApiParam({ 
    name: 'id', 
    description: 'MongoDB ObjectID of the employee',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({ type: UpdateEmployeeDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Employee updated successfully.', 
    type: GetEmployeeDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Employee not found.' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data.' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Employee with userId already exists.' 
  })
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
  @ApiOperation({ summary: 'Delete an employee by ID' })
  @ApiParam({ 
    name: 'id', 
    description: 'MongoDB ObjectID of the employee',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Employee deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Employee deleted successfully' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Employee not found.' 
  })
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
}