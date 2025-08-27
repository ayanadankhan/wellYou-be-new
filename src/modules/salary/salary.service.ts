import { ConflictException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { Salary } from './entities/salary.entity';
import { requestMangmentervice } from '../request-mangment/request-mangment.service'; // Importing the service
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SalaryService {
  constructor(
    @InjectModel(Salary.name) private readonly salaryModel: Model<Salary>,
    private readonly requestMangmentService: requestMangmentervice,
    private readonly auditService: AuditService,
  ) {}

  async create(createSalaryDto: CreateSalaryDto, currentUser: any): Promise<Salary> {
    const employeesId = new Types.ObjectId(createSalaryDto.employeesId);

    const existingSalary = await this.salaryModel.findOne({
      employeesId: employeesId,
    });

    if (existingSalary) {
      throw new ConflictException('Salary for this employee already exists.');
    }

    const createdSalary = new this.salaryModel({
      ...createSalaryDto,
      employeesId,
    });

    await this.auditService.log(
      'salary',
      'create',
      currentUser._id.toString(),
      createdSalary.toObject(),
      null
    );

    return createdSalary.save();
  }

  async findAll(user: any): Promise<any[]> {
    if (!user?.tenantId || !Types.ObjectId.isValid(user.tenantId)) {
      throw new HttpException('Invalid tenant ID', HttpStatus.BAD_REQUEST);
    }

    const salaries = await this.salaryModel.aggregate([
      {
        $lookup: {
          from: 'employees',
          localField: 'employeesId',
          foreignField: '_id',
          as: 'employeeData',
        },
      },
      { $unwind: { path: '$employeeData', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          'employeeData.tenantId': new Types.ObjectId(user.tenantId),
          'employeeData.employmentStatus': { $ne: 'INACTIVE' }
        },
      },
      {
        $addFields: {
          employeesId: '$employeeData',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'employeesId.userId',
          foreignField: '_id',
          as: 'employeesId.userId',
        },
      },
      { $unwind: { path: '$employeesId.userId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'departments',
          localField: 'employeesId.departmentId',
          foreignField: '_id',
          as: 'employeesId.departmentId',
        },
      },
      { $unwind: { path: '$employeesId.departmentId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'designations',
          localField: 'employeesId.positionId',
          foreignField: '_id',
          as: 'employeesId.positionId',
        },
      },
      { $unwind: { path: '$employeesId.positionId', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          salaryPay: 1,
          deductions: 1,
          additions: 1,
          paymentDetails: 1,
          createdAt: 1,
          updatedAt: 1,
          
          employeesId: {
            _id: 1,
            profilePicture: 1,
            userId: {
              _id: 1,
              name: {
                $concat: ['$employeesId.userId.firstName', ' ', '$employeesId.userId.lastName']
              }
            },
            positionId: {
              _id: 1,
              title: 1
            },
            departmentId: {
              _id: 1,
              departmentName: 1
            }
          }
        }
      }
    ]).exec();

  const resultWithRequests = await Promise.all(
    salaries.map(async (salary) => {
      const employeeId = salary.employeesId?._id;
      const basePay = salary.salaryPay?.basePay || 0;

      if (!employeeId) return salary;

      const requests = await this.requestMangmentService.getLoanAndOvertimeByEmployeeId(employeeId);

      const updatedRequests = (requests || []).map((req: any) => {
        if (req.type?.toLowerCase() === 'overtime' && req.overtimeDetails?.totalHour) {
          const hourlyRate = basePay / 208;
          const overtimeAmount = hourlyRate * req.overtimeDetails.totalHour;

          return {
            ...req,
            amount: Math.round(overtimeAmount),
          };
        }
        return req;
      });

      return {
        ...salary,
        loanAndOvertimeRequests: updatedRequests.map((r) =>
          r._doc ? { ...r._doc, amount: r.amount } : r
        ),
      };
        }),
    );
    return resultWithRequests;
  }

  async findOne(id: string): Promise<Salary> {
    const salary = await this.salaryModel.findById(id).exec();
    if (!salary) {
      throw new NotFoundException(`Salary with ID ${id} not found`);
    }
    return salary;
  }

  async update(id: string, updateSalaryDto: UpdateSalaryDto, currentUser?: any): Promise<Salary> {
    const existing = await this.salaryModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Salary with ID ${id} not found`);
    }
    const updatedSalary = await this.salaryModel
      .findByIdAndUpdate(id, updateSalaryDto, { new: true })
      .exec();
      
    if (!updatedSalary) {
      throw new NotFoundException(`Salary with ID ${id} not found`);
    }

    await this.auditService.log(
      'salary',
      'update',
      currentUser._id.toString(),
      updatedSalary.toObject(),
      existing.toObject()
    );

    return updatedSalary;
  }

  async remove(id: string, currentUser?: any,): Promise<Salary> {
    const deletedSalary = await this.salaryModel.findByIdAndDelete(id).exec();
    if (!deletedSalary) {
      throw new NotFoundException(`Salary with ID ${id} not found`);
    }

    await this.auditService.log(
      'salary',
      'delete',
      currentUser?._id?.toString(),
      null,
      deletedSalary.toObject()
    );

    return deletedSalary;
  }

  async findByEmployee(employeeId: string): Promise<Salary[]> {
    return this.salaryModel.find({ employeesId: employeeId }).exec();
  }
}