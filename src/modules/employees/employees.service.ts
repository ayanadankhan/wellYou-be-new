import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
      this.logger.log(`Creating employee with userId: ${createEmployeeDto.userId}`);
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

  async findAll(query: {
    userId?: string;
    departmentId?: string;
    positionId?: string;
    managerId?: string;
    employmentStatus?: string;
    tenantId?: string;
  } = {}): Promise<GetEmployeeDto[]> {
    try {
      this.logger.log(`🔍 Aggregation filter: ${JSON.stringify(query)}`);

      const matchStage: any = {};

      if (query.userId) {
        matchStage.userId = new Types.ObjectId(query.userId);
      }

      if (query.departmentId) {
        matchStage.departmentId = new Types.ObjectId(query.departmentId);
      }

      if (query.positionId) {
        matchStage.positionId = new Types.ObjectId(query.positionId);
      }

      if (query.managerId) {
        matchStage.managerId = new Types.ObjectId(query.managerId);
      }

      if (query.employmentStatus) {
        matchStage.employmentStatus = query.employmentStatus;
      }

      if (query.tenantId) {
        matchStage.tenantId = new Types.ObjectId(query.tenantId);
      }

      const employees = await this.employeeModel.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'departmentId',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'designations',
            localField: 'positionId',
            foreignField: '_id',
            as: 'position',
          },
        },
        { $unwind: { path: '$position', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            'user.password': 0,
          },
        }
      ]);

      this.logger.log(`✅ Retrieved ${employees.length} employees via aggregation`);
      return employees.map(emp => plainToClass(GetEmployeeDto, emp));
    } catch (error) {
      this.logger.error(`❌ Aggregation failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch employees via aggregation',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async findEmployeeIdByUserId(userId: string): Promise<string | null> {
  try {
    this.logger.log(`Searching for employee ID with userId: ${userId}`);
    
    // Assuming you're using a repository pattern
    const employee = await this.employeeModel.findOne({
      where: { userId },
      select: ['id'] // Only select the employee ID field
    });
    
    if (!employee) {
      this.logger.warn(`No employee found with userId: ${userId}`);
      return null;
    }
    
    this.logger.log(`Employee ID found for userId ${userId}: ${employee.id}`);
    return employee.id;
  } catch (error) {
    this.logger.error(`Error finding employee ID for userId ${userId}: ${error.message}`, error.stack);
    throw error;
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
      
      const employee = await this.employeeModel.aggregate([
        { $match: { _id: new Types.ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'departmentId',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'positions',
            localField: 'positionId',
            foreignField: '_id',
            as: 'position',
          },
        },
        { $unwind: { path: '$position', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'managerId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$manager', preserveNullAndEmptyArrays: true } },
        { $project: { 'user.password': 0 } },
        { $limit: 1 }
      ]);

      if (!employee || employee.length === 0) {
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
      return plainToClass(GetEmployeeDto, employee[0]);
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

async findByUserId(userId: string): Promise<GetEmployeeDto> {
    try {
      this.logger.log(`Fetching employee with userId: ${userId}`);
      
      const employee = await this.employeeModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'departmentId',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'designations',
            localField: 'positionId',
            foreignField: '_id',
            as: 'position',
          },
        },
        { $unwind: { path: '$position', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'managerId',
            foreignField: '_id',
            as: 'manager',
          },
        },
        { $unwind: { path: '$manager', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'salaries',
            localField: '_id',
            foreignField: 'employeesId',
            as: 'salary',
          },
        },
        { $unwind: { path: '$salary', preserveNullAndEmptyArrays: true } },
        { $project: { 'user.password': 0 } },
        { $limit: 1 }
      ]);

      if (!employee || employee.length === 0) {
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
      return plainToClass(GetEmployeeDto, employee[0]);
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