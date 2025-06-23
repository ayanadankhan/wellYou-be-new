import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePayrollDto } from './dto/create-payroll-dto';
import { UpdatePayrollDto } from './dto/update-payroll-dto';
import { Payroll } from './entities/payroll.entity';

@Injectable()
export class PayrollService {
  constructor(
    @InjectModel(Payroll.name) private readonly payrollModel: Model<Payroll>,
  ) {}

  async create(createPayrollDto: CreatePayrollDto): Promise<Payroll> {
    // Check if payroll already exists for this month
    const existingPayroll = await this.payrollModel.findOne({
      payrollMonth: createPayrollDto.payrollMonth,
    }).exec();

    if (existingPayroll) {
      throw new ConflictException(`Payroll for month ${createPayrollDto.payrollMonth} already exists`);
    }

    // ✅ Convert string IDs to ObjectId in selectedEmployees
    const processedData = {
      ...createPayrollDto,
      selectedEmployees: createPayrollDto.selectedEmployees.map(employee => ({
        ...employee,
        employeesId: {
          ...employee.employeesId,
          _id: new Types.ObjectId(employee.employeesId._id), // Convert string to ObjectId
        },
      })),
    };

    try {
      const createdPayroll = new this.payrollModel(processedData);
      return await createdPayroll.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(`Payroll for month ${createPayrollDto.payrollMonth} already exists`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Payroll[]> {
    return this.payrollModel.find().sort({ payrollMonth: -1 }).exec();
  }

  async findOne(id: string): Promise<Payroll> {
    const payroll = await this.payrollModel.findById(id).exec();
    if (!payroll) {
      throw new NotFoundException(`Payroll with ID ${id} not found`);
    }
    return payroll;
  }

  async findOneByMonth(payrollMonth: string): Promise<Payroll | null> {
    return this.payrollModel.findOne({ payrollMonth }).exec();
  }

  async update(id: string, updatePayrollDto: UpdatePayrollDto): Promise<Payroll> {
    if (updatePayrollDto.payrollMonth) {
      const existingPayroll = await this.payrollModel.findOne({
        payrollMonth: updatePayrollDto.payrollMonth,
        _id: { $ne: id }
      }).exec();

      if (existingPayroll) {
        throw new ConflictException(`Payroll for month ${updatePayrollDto.payrollMonth} already exists`);
      }
    }

    const updatedPayroll = await this.payrollModel
      .findByIdAndUpdate(id, updatePayrollDto, { new: true })
      .exec();
    
    if (!updatedPayroll) {
      throw new NotFoundException(`Payroll with ID ${id} not found`);
    }
    return updatedPayroll;
  }

  async remove(id: string): Promise<void> {
    const result = await this.payrollModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Payroll with ID ${id} not found`);
    }
  }

  async getPayrollSummary(): Promise<{
    totalPayrolls: number;
    totalAmountPaid: number;
    lastPayrollMonth: string | null;
  }> {
    const [count, lastPayroll] = await Promise.all([
      this.payrollModel.countDocuments(),
      this.payrollModel.findOne().sort({ payrollMonth: -1 }).select('payrollMonth netPay').exec()
    ]);

    return {
      totalPayrolls: count,
      totalAmountPaid: lastPayroll?.netPay || 0,
      lastPayrollMonth: lastPayroll?.payrollMonth || null
    };
  }

  async findByEmployeeId(employeeId: string): Promise<any[]> {
    try {
      if (!Types.ObjectId.isValid(employeeId)) {
        throw new HttpException('Invalid employee ID', HttpStatus.BAD_REQUEST);
      }

      const payrolls = await this.payrollModel.aggregate([
        {
          $match: {
            'selectedEmployees.employeesId._id': new Types.ObjectId(employeeId),
          },
        },
        { $unwind: '$selectedEmployees' },
        {
          $match: {
            'selectedEmployees.employeesId._id': new Types.ObjectId(employeeId),
          },
        },
        {
          $lookup: {
            from: 'employees',
            localField: 'selectedEmployees.employeesId._id',
            foreignField: '_id',
            as: 'employeeDetails',
          },
        },
        { $unwind: '$employeeDetails' },
        {
          $project: {
            _id: 1,
            payrollMonth: 1,
            totalGross: 1,
            totalDeduction: 1,
            totalAddition: 1,
            netPay: 1,
            status: 1,
            employeeData: {
              payPeriodStart: '$selectedEmployees.payPeriodStart',
              payPeriodEnd: '$selectedEmployees.payPeriodEnd',
              salaryPay: '$selectedEmployees.salaryPay',
              deductions: '$selectedEmployees.deductions',
              additions: '$selectedEmployees.additions',
              paymentDetails: '$selectedEmployees.paymentDetails',
              status: '$selectedEmployees.status',
              employeeInfo: {
                _id: '$employeeDetails._id',
                firstName: '$employeeDetails.userId.firstName',
                lastName: '$employeeDetails.userId.lastName',
                position: '$employeeDetails.positionId.title',
                department: '$employeeDetails.departmentId.departmentName',
              },
            },
          },
        },
      ]);

      if (!payrolls || payrolls.length === 0) {
        throw new HttpException(
          `No payroll records found for employee with ID ${employeeId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return payrolls;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch payroll records',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}