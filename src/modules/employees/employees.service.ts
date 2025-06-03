import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from './schemas/Employee.schema';
import { CreateEmployeeDto } from './dto/create-Employee.dto';
import { UpdateEmployeeDto } from './dto/update-Employee.dto';
import { GetEmployeeDto } from './dto/get-Employee.dto';
import { isValidObjectId } from 'mongoose';
import { plainToClass } from 'class-transformer';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<GetEmployeeDto> {
    try {
      this.logger.log(`Creating employee with name: ${createEmployeeDto.name}`);
      const employee = new this.employeeModel(createEmployeeDto);
      const savedEmployee = await employee.save();
      this.logger.log(`Employee created successfully with ID: ${savedEmployee._id}`);
      return plainToClass(GetEmployeeDto, savedEmployee.toObject());
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

  async findAll(query: { name?: string; department?: string } = {}): Promise<GetEmployeeDto[]> {
    try {
      this.logger.log(`Fetching employees with query: ${JSON.stringify(query)}`);
      const filter: any = {};
      if (query.name) {
        filter.name = { $regex: query.name, $options: 'i' }; // Case-insensitive partial match
      }
      if (query.department) {
        filter.department = query.department;
      }
      const employees = await this.employeeModel.find(filter).exec();
      this.logger.log(`Retrieved ${employees.length} employees`);
      return employees.map(employee => plainToClass(GetEmployeeDto, employee.toObject()));
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

  async findOne(id: string): Promise<GetEmployeeDto> {
    try {
      if (!isValidObjectId(id)) {
        this.logger.warn(`Invalid MongoDB ObjectID: ${id}`);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid ID',
            message: `Provided ID ${id} is not a valid MongoDB ObjectID`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.log(`Fetching employee with ID: ${id}`);
      const employee = await this.employeeModel.findById(id).exec();
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
      return plainToClass(GetEmployeeDto, employee.toObject());
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

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<GetEmployeeDto> {
    try {
      if (!isValidObjectId(id)) {
        this.logger.warn(`Invalid MongoDB ObjectID: ${id}`);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid ID',
            message: `Provided ID ${id} is not a valid MongoDB ObjectID`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.log(`Updating employee with ID: ${id}`);
      const updatedEmployee = await this.employeeModel
        .findByIdAndUpdate(id, { $set: updateEmployeeDto }, { new: true })
        .exec();
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
      return plainToClass(GetEmployeeDto, updatedEmployee.toObject());
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

  async remove(id: string): Promise<GetEmployeeDto> {
    try {
      if (!isValidObjectId(id)) {
        this.logger.warn(`Invalid MongoDB ObjectID: ${id}`);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid ID',
            message: `Provided ID ${id} is not a valid MongoDB ObjectID`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.log(`Deleting employee with ID: ${id}`);
      const deletedEmployee = await this.employeeModel.findByIdAndDelete(id).exec();
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
      return plainToClass(GetEmployeeDto, deletedEmployee.toObject());
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