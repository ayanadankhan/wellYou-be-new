import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from './schemas/Employee.schema';
import { CreateEmployeeDto } from './dto/create-Employee.dto';
import { UpdateEmployeeDto } from './dto/update-Employee.dto';
import { GetEmployeeDto } from './dto/get-Employee.dto';
import { isValidObjectId } from 'mongoose';
import { plainToClass } from 'class-transformer';
// import { MailService } from '../mail/mail.service';
import { InjectModel as InjectUserModel } from '@nestjs/mongoose';
import { User } from '../tenant/users/schemas/user.schema'; // 👈 Import User schema

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(User.name) private readonly userModel: Model<any>, // For fetching email/password
    // private readonly mailService: MailService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<GetEmployeeDto> {
    try {
      this.logger.log(`Creating employee with userId: ${createEmployeeDto.userId}`);
      
      // Save employee first
      const employee = new this.employeeModel(createEmployeeDto);
      const savedEmployee = await employee.save();

      // send email logic temprorary disable.
      
      // const user = await this.userModel.findById(createEmployeeDto.userId).lean<User>();

      // if (user?.email && user?.password) {
        
      //   const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      //   await this.mailService.sendWelcomeEmail(
      //     user.email,
      //     fullName,
      //     user.email,
      //     user.password // ✅ hashed password (temporary)
      //   );
      //       this.logger.log(`📧 Welcome email sent to ${user.email}`);
      //     } else {
      //       this.logger.warn(`⚠️ Could not send email — user not found or missing info`);
      //     }

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

  async findAll (getDto: GetEmployeeDto): Promise<GetEmployeeDto[]> {
    try {
      this.logger.log(`🔍 Aggregation filter: ${JSON.stringify(getDto)}`);

      const matchStage: any = {};

      if (getDto.userId) {
        matchStage.userId = new Types.ObjectId(getDto.userId);
      }

      if (getDto.departmentId) {
        matchStage.departmentId = new Types.ObjectId(getDto.departmentId);
      }

      if (getDto.positionId) {
        matchStage.positionId = new Types.ObjectId(getDto.positionId);
      }

      if (getDto.reportingTo) {
        matchStage.reportingTo = new Types.ObjectId(getDto.reportingTo);
      }

      if (getDto.employmentStatus) {
        matchStage.employmentStatus = getDto.employmentStatus;
      }

      if (getDto.tenantId) {
        matchStage.tenantId = new Types.ObjectId(getDto.tenantId);
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
          $lookup: {
            from: 'users',
            localField: 'reportingTo',
            foreignField: '_id',
            as: 'reportingTo',
          },
        },
        { $unwind: { path: '$reportingTo', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            'progress.totalProgress': {
              $round: [
                {
                  $avg: [
                    '$progress.basicInfo',
                    '$progress.personalInfo',
                    '$progress.education',
                    '$progress.certification',
                    '$progress.employment',
                    '$progress.experience',
                    '$progress.skills',
                    '$progress.documents'
                  ]
                },
                0
              ]
            }
          }
        },
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
      this.logger.log(`UserId type: ${typeof userId}, length: ${userId.length}`);

      const mongoose = require('mongoose');
    
      if (!mongoose.Types.ObjectId.isValid(userId)) {
      this.logger.warn(`Invalid ObjectId format: ${userId}`);
      return null;
      }
    
      const userObjectId = new mongoose.Types.ObjectId(userId);
      this.logger.log(`Converted userId to ObjectId: ${userObjectId}`);

      const employee = await this.employeeModel.findOne({ 
      userId: userObjectId 
    }).select('_id userId');
    
    if (!employee) {
      this.logger.warn(`No employee found with userId: ${userId}`);
      
      // Debug: Let's check what employees exist
      const totalEmployees = await this.employeeModel.countDocuments();
      this.logger.log(`Total employees in collection: ${totalEmployees}`);
      
      if (totalEmployees > 0) {
        // Get a sample employee to see the data structure
        const sampleEmployee = await this.employeeModel.findOne().select('_id userId');
        
        // Check if any employee has this userId (even with different types)
        const employeeWithStringUserId = await this.employeeModel.findOne({ 
          userId: userId // Try as string
        }).select('_id userId');
        
        this.logger.log(`Employee found with string userId: ${employeeWithStringUserId ? 'Yes' : 'No'}`);
      }
      
      return null;
    }
    
    this.logger.log(`Employee found - _id: ${employee._id}, userId: ${employee.userId}`);
    return employee._id.toString();
    
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
            localField: 'reportingTo',
            foreignField: '_id',
            as: 'reportingTo',
          },
        },
        { $unwind: { path: '$reportingTo', preserveNullAndEmptyArrays: true } },
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
              localField: 'reportingTo',
              foreignField: '_id',
              as: 'reportingTo',
            },
          },
          { $unwind: { path: '$reportingTo', preserveNullAndEmptyArrays: true } },
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
      // ✅ Validate ID
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

      // ✅ Validate & cleanup reportingTo
      if (
        'reportingTo' in updateEmployeeDto &&
        (!updateEmployeeDto.reportingTo || !isValidObjectId(updateEmployeeDto.reportingTo))
      ) {
        delete updateEmployeeDto.reportingTo;
      }

      // ✅ Fetch existing employee to safely merge progress
      const existingEmployee = await this.employeeModel.findById(id).exec();

      if (!existingEmployee) {
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

      // ✅ Merge progress object safely
      if (updateEmployeeDto.progress && existingEmployee.progress) {
        updateEmployeeDto.progress = {
          ...existingEmployee.progress,
          ...updateEmployeeDto.progress,
        };
      }

      // ✅ Update employee
      const updatedEmployee = await this.employeeModel
        .findByIdAndUpdate(id, { $set: updateEmployeeDto }, { new: true })
        .exec();

      this.logger.log(`Employee with ID ${id} updated successfully`);

      return plainToClass(GetEmployeeDto, updatedEmployee?.toObject());
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