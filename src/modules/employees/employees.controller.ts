import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Logger, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-Employee.dto';
import { UpdateEmployeeDto } from './dto/update-Employee.dto';
import { GetEmployeeDto } from './dto/get-Employee.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { EmploymentStatus } from './dto/create-Employee.dto';
import { Types } from 'mongoose';
import { CurrentUser} from '@/common/decorators/user.decorator';
import { User, UserRole, UserSchema } from '../tenant/users/schemas/user.schema';
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
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() user: User
  ): Promise<any> {
    try {
      if (!user.tenantId) {
        throw new HttpException(
          'Your account has no tenant association',
          HttpStatus.FORBIDDEN
        );
      }

      const employeeData = {
        ...createEmployeeDto,
        tenantId: new Types.ObjectId(user.tenantId),
      };

      return await this.employeesService.create(employeeData);
      
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
    @CurrentUser() user: User,
    @Query('userId') userId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('positionId') positionId?: string,
    @Query('reportingTo') reportingTo?: string,
    @Query('employmentStatus') employmentStatus?: string,
  ): Promise<GetEmployeeDto[]> {
    try {
      // Build base query
      const query: any = {
        ...(userId && { userId: new Types.ObjectId(userId) }),
        ...(departmentId && { departmentId: new Types.ObjectId(departmentId) }),
        ...(positionId && { positionId: new Types.ObjectId(positionId) }),
        ...(reportingTo && { reportingTo: new Types.ObjectId(reportingTo) }),
        ...(employmentStatus && { employmentStatus }),
      };

      if (user.role !== UserRole.SUPER_ADMIN) {
        if (!user.tenantId) {
          throw new HttpException(
            'User does not have tenant access',
            HttpStatus.FORBIDDEN
          );
        }
        query.tenantId = new Types.ObjectId(user.tenantId);
      }

      return this.employeesService.findAll(query);
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