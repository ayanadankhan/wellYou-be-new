import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePayrollDto } from './dto/create-payroll-dto';
import { UpdatePayrollDto } from './dto/update-payroll-dto';
import { Payroll, PayrollStatus } from './entities/payroll.entity';
import { GetPayrollDto } from './dto/get-payroll-dto';

@Injectable()
export class PayrollService {
  constructor(
    @InjectModel(Payroll.name) private readonly payrollModel: Model<Payroll>,
  ) {}

  async create(createPayrollDto: CreatePayrollDto, user: any): Promise<Payroll> {
      if (!user?.tenantId || !Types.ObjectId.isValid(user.tenantId)) {
          throw new HttpException('Invalid tenant ID', HttpStatus.BAD_REQUEST);
      }

  const existingPayroll = await this.payrollModel.findOne({
      payrollMonth: createPayrollDto.payrollMonth,
      tenantId: new Types.ObjectId(user.tenantId)
  }).exec();

      if (existingPayroll) {
          throw new ConflictException(`Payroll for month ${createPayrollDto.payrollMonth} already exists`);
      }

      const processedData = {
          ...createPayrollDto,
          tenantId: new Types.ObjectId(user.tenantId),
          selectedEmployees: createPayrollDto.selectedEmployees.map(employee => ({
              ...employee,
              employeesId: new Types.ObjectId(employee.employeesId),
              payPeriodStart: new Date(employee.payPeriodStart),
              payPeriodEnd: new Date(employee.payPeriodEnd),
              additions: employee.additions || [],
              deductions: employee.deductions || []
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

  async findAll(
    getDto: GetPayrollDto,
    user: any
  ): Promise<{ count: number; list: any[] }> {
    try {
      if (!user?.tenantId || !Types.ObjectId.isValid(user.tenantId)) {
        throw new HttpException('Invalid tenant ID', HttpStatus.BAD_REQUEST);
      }

      const pipeline: any[] = [
        { $match: { tenantId: new Types.ObjectId(user.tenantId) } }
      ];

      // Apply filters
      if (getDto.payrollMonth) {
        pipeline.push({ $match: { payrollMonth: getDto.payrollMonth } });
      }
      if (getDto.status) {
        pipeline.push({ $match: { status: getDto.status } });
      }

      // Common pipeline for both count and list queries
      const commonPipeline = [
        ...pipeline,
        { $unwind: "$selectedEmployees" },
        {
          $lookup: {
            from: "employees",
            localField: "selectedEmployees.employeesId",
            foreignField: "_id",
            as: "employee"
          }
        },
        { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "employee.userId",
            foreignField: "_id",
            as: "employee.user"
          }
        },
        { $unwind: { path: "$employee.user", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "departments",
            localField: "employee.departmentId",
            foreignField: "_id",
            as: "employee.department"
          }
        },
        { $unwind: { path: "$employee.department", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "designations",
            localField: "employee.positionId",
            foreignField: "_id",
            as: "employee.position"
          }
        },
        { $unwind: { path: "$employee.position", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$_id",
            payrollMonth: { $first: "$payrollMonth" },
            totalGross: { $first: "$totalGross" },
            totalDeduction: { $first: "$totalDeduction" },
            totalAddition: { $first: "$totalAddition" },
            netPay: { $first: "$netPay" },
            status: { $first: "$status" },
            selectedEmployees: {
              $push: {
                $mergeObjects: [
                  "$selectedEmployees",
                  {
                    employeeDetails: {
                      _id: "$employee._id",
                      name: {
                        $concat: [
                          "$employee.user.firstName",
                          " ",
                          "$employee.user.lastName"
                        ]
                      },
                      email: "$employee.user.email",
                      department: "$employee.department.departmentName",
                      position: "$employee.position.title",
                      profilePicture: "$employee.profilePicture",
                      employmentType: "$employee.employmentType",
                      hireDate: "$employee.hireDate"
                    }
                  }
                ]
              }
            }
          }
        },
        {
          $project: {
            "selectedEmployees.employeeDetails.userId": 0,
            "selectedEmployees.employeesId": 0
          }
        }
      ];

      const [list, countQuery] = await Promise.all([
        this.payrollModel.aggregate([
          ...commonPipeline,
          { $sort: { [getDto.sb || 'payrollMonth']: getDto.sd === 'asc' ? 1 : -1 } },
          { $skip: Number(getDto.o) || 0 },
          { $limit: Number(getDto.l) || 10 },
        ]).exec(),
        this.payrollModel.aggregate([
          ...pipeline,
          { $count: 'total' }
        ]).exec(),
      ]);

      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch payroll records',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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
        const existingPayroll = await this.payrollModel.findById(id).exec();
        if (!existingPayroll) {
            throw new NotFoundException(`Payroll with ID ${id} not found`);
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const [existingMonthName, existingYearStr] = existingPayroll.payrollMonth.split(' ');
        const existingYear = parseInt(existingYearStr);
        const existingMonth = new Date(`${existingMonthName} 1, ${existingYear}`).getMonth();

        if (existingMonth !== currentMonth || existingYear !== currentYear) {
            const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
            const currentPayrollMonth = `${currentMonthName} ${currentYear}`;
            throw new ConflictException(
                `You can only update payroll for the current month (${currentPayrollMonth}). ` +
                `This payroll is for ${existingPayroll.payrollMonth}.`
            );
        }

        if (updatePayrollDto.payrollMonth && updatePayrollDto.payrollMonth !== existingPayroll.payrollMonth) {
            const conflict = await this.payrollModel.findOne({
                payrollMonth: updatePayrollDto.payrollMonth,
                _id: { $ne: id }
            }).exec();
            if (conflict) {
                throw new ConflictException(`Payroll for month ${updatePayrollDto.payrollMonth} already exists`);
            }
        }

    const incomingEmployees = updatePayrollDto.selectedEmployees?.map(employee => ({
          ...employee,
          employeesId: new Types.ObjectId(employee.employeesId),
          payPeriodStart: new Date(employee.payPeriodStart),
          payPeriodEnd: new Date(employee.payPeriodEnd),
          additions: employee.additions || [],
          deductions: employee.deductions || [],
          salaryPay: employee.salaryPay || { basePay: 0 }
      })) || [];

      const updatedEmployees = [...existingPayroll.selectedEmployees];
      
      for (const incomingEmp of incomingEmployees) {
          const existingIndex = updatedEmployees.findIndex(emp => 
              emp.employeesId.equals(incomingEmp.employeesId)
          );
          if (existingIndex >= 0) {
              const existingEmp = updatedEmployees[existingIndex];
              updatedEmployees[existingIndex] = {
                  ...existingEmp,
                  ...incomingEmp,
                  additions: [...(existingEmp.additions || []), ...(incomingEmp.additions || [])],
                  deductions: [...(existingEmp.deductions || []), ...(incomingEmp.deductions || [])],
                  salaryPay: incomingEmp.salaryPay || existingEmp.salaryPay
              };
          } else {
              updatedEmployees.push(incomingEmp);
          }
      }

      let totalBasePay = 0;
      let totalAddition = 0;
      let totalDeduction = 0;

      for (const emp of updatedEmployees) {
          totalBasePay += emp.salaryPay?.basePay || 0;
          for (const add of emp.additions) {
              totalAddition += add.amount || 0;
          }
          for (const ded of emp.deductions) {
              totalDeduction += ded.amount || 0;
          }
      }
      const grossEarnings = totalBasePay + totalAddition;
      const totalGross = grossEarnings;
      const netPay = grossEarnings - totalDeduction;

      const finalUpdate = {
          ...updatePayrollDto,
          selectedEmployees: updatedEmployees,
          totalBasePay,
          totalAddition,
          totalDeduction,
          totalGross,
          netPay,
          updatedAt: new Date()
      };

      const updatedPayroll = await this.payrollModel.findByIdAndUpdate(
          id,
          { $set: finalUpdate },
          { new: true, runValidators: true }
      ).exec();

      if (!updatedPayroll) {
          throw new NotFoundException(`Payroll with ID ${id} not found after update`);
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

      const records = await this.payrollModel.aggregate([
        { $sort: { payrollMonth: -1 } },
        { $unwind: "$selectedEmployees" },
        {
          $match: {
            "selectedEmployees.employeesId": new Types.ObjectId(employeeId),
          },
        },
        {
          $lookup: {
            from: "employees",
            localField: "selectedEmployees.employeesId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "employee.userId",
            foreignField: "_id",
            as: "employee.user",
          },
        },
        { $unwind: { path: "$employee.user", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "departments",
            localField: "employee.departmentId",
            foreignField: "_id",
            as: "employee.department",
          },
        },
        { $unwind: { path: "$employee.department", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "designations",
            localField: "employee.positionId",
            foreignField: "_id",
            as: "employee.position",
          },
        },
        { $unwind: { path: "$employee.position", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "companies",
            localField: "employee.tenantId",
            foreignField: "_id",
            as: "employee.company",
          },
        },
      { $unwind: { path: "$employee.company", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            payrollMonth: 1,
            salaryData: {
              payPeriodStart: "$selectedEmployees.payPeriodStart",
              payPeriodEnd: "$selectedEmployees.payPeriodEnd",
              salaryPay: "$selectedEmployees.salaryPay",
              deductions: "$selectedEmployees.deductions",
              additions: "$selectedEmployees.additions",
              paymentDetails: "$selectedEmployees.paymentDetails",
              status: "$selectedEmployees.status",
              employeeInfo: {
                _id: "$employee._id",
                name: {
                  $concat: [
                    { $ifNull: ["$employee.user.firstName", ""] },
                    " ",
                    { $ifNull: ["$employee.user.lastName", ""] }
                  ]
                },
                email: "$employee.user.email",
                department: "$employee.department.departmentName",
                position: "$employee.position.title",
                profilePicture: "$employee.profilePicture",
                employmentType: "$employee.employmentType",
                hireDate: "$employee.hireDate",
                company: {
                  _id: "$employee.company._id",
                  name: "$employee.company.name",
                  industry: "$employee.company.industry",
                  email: "$employee.company.email",
                  number: "$employee.company.number",
                  address: "$employee.company.address",
                  foundedYear: "$employee.company.foundedYear",
                  numberOfEmployees: "$employee.company.numberOfEmployees",
                  description: "$employee.company.description",
                  status: "$employee.company.status"
                }
              }
            }
          }
        }
      ]);

      if (!records || records.length === 0) {
        throw new HttpException(
          `No payroll records found for employee with ID ${employeeId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return records;
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

  async updateEmployeeStatuses(payrollId: string, updatedEmployees: { employeesId: string, status: string }[]) {
    const payroll = await this.payrollModel.findById(payrollId);
    if (!payroll) throw new Error('Payroll not found');
      payroll.selectedEmployees = payroll.selectedEmployees.map((employee: any) => {
        const updated = updatedEmployees.find(e => e.employeesId === employee.employeesId.toString());
        if (updated) {
          return {
            ...employee,
            status: updated.status
          };
        }
        return employee;
      });
    const allPaid = payroll.selectedEmployees.every((emp: any) => emp.status === 'PAID');
    if (allPaid) {
      payroll.status = PayrollStatus.PAID;
    }
    await payroll.save();
    return payroll;
  }

}