import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Logger, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-Employee.dto';
import { UpdateEmployeeDto } from './dto/update-Employee.dto';
import { GetEmployeeDto } from './dto/get-Employee.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Employee created successfully.', type: GetEmployeeDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<GetEmployeeDto> {
    try {
      this.logger.log(`Creating employee with User Id: ${createEmployeeDto.userId}`);
      const result = await this.employeesService.create(createEmployeeDto);
      this.logger.log(`Employee created successfully with ID: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create employee: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to create employee',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all employees' })
  @ApiQuery({ name: 'firstName', required: false, type: String, description: 'Filter by first name (partial match)' })
  @ApiQuery({ name: 'lastName', required: false, type: String, description: 'Filter by last name (partial match)' })
  @ApiQuery({ name: 'departmentId', required: false, type: String, description: 'Filter by department ID' })
  @ApiQuery({ name: 'employmentStatus', required: false, type: String, description: 'Filter by employment status', enum: ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RETIRED'] })
  @ApiResponse({ status: 200, description: 'List of all employees.', type: [GetEmployeeDto] })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async findAll(
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string,
    @Query('departmentId') departmentId?: string,
    @Query('employmentStatus') employmentStatus?: string
  ): Promise<GetEmployeeDto[]> {
    try {
      this.logger.log(`Fetching employees with query: firstName=${firstName}, lastName=${lastName}, departmentId=${departmentId}, employmentStatus=${employmentStatus}`);
      const query: any = {};
      if (firstName) query.firstName = { $regex: firstName, $options: 'i' };
      if (lastName) query.lastName = { $regex: lastName, $options: 'i' };
      if (departmentId) query.departmentId = departmentId;
      if (employmentStatus) query.employmentStatus = employmentStatus;
      
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

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single employee by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectID of the employee' })
  @ApiResponse({ status: 200, description: 'Employee found.', type: GetEmployeeDto })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
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
  @ApiParam({ name: 'id', description: 'MongoDB ObjectID of the employee' })
  @ApiBody({ type: UpdateEmployeeDto })
  @ApiResponse({ status: 200, description: 'Employee updated successfully.', type: GetEmployeeDto })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto): Promise<GetEmployeeDto> {
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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to update employee',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an employee by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectID of the employee' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
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