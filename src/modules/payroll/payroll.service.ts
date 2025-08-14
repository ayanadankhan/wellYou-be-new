import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePayrollDto } from './dto/create-payroll-dto';
import { UpdatePayrollDto } from './dto/update-payroll-dto';
import { Payroll, PayrollStatus } from './entities/payroll.entity';
import { GetPayrollDto } from './dto/get-payroll-dto';
import { AuditService } from '../audit/audit.service';
import { RequestMangment, RequestMangmentDocument } from '../request-mangment/entities/request-mangment.entity';

@Injectable()
export class PayrollService {
constructor(
  @InjectModel(Payroll.name) private readonly payrollModel: Model<Payroll>,
  private readonly auditService: AuditService,
  @InjectModel(RequestMangment.name) private readonly RequestMangmentModel: Model<RequestMangmentDocument>,
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

          await this.auditService.log(
            'payroll',
            'create',
            user._id.toString(),
            createdPayroll.toObject(),
            null
          );

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

  async update(id: string, updatePayrollDto: UpdatePayrollDto, currentUser: any): Promise<Payroll> {
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

    await this.auditService.log(
      'payroll',
      'update',
      currentUser._id.toString(),
      updatedPayroll.toObject(),
      existingPayroll.toObject()
    );
      return updatedPayroll;
  }

  async remove(id: string, currentUser: any): Promise<void> {
    const result = await this.payrollModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Payroll with ID ${id} not found`);
    }

    await this.auditService.log(
      'payroll',
      'delete',
      currentUser?._id?.toString(),
      null,
      result.toObject()
    );
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

  async getCurrentMonthPayrollSummary(tenantId: string) {
    // Get current month and year
    const now = new Date();
    const monthName = now.toLocaleString('en-US', { month: 'long' });
    const year = now.getFullYear();
    const currentMonthName = `${monthName} ${year}`;
    // Find payroll for this tenant and month
    const payroll = await this.payrollModel.findOne({
      tenantId: new Types.ObjectId(tenantId), // ✅ ObjectId match
      payrollMonth: currentMonthName,
    }).lean<{ 
      netPay?: number;
      selectedEmployees?: {
        salaryPay?: { basePay?: number };
        status?: string;
      }[];
      createdAt?: Date;
    }>();

    // If no payroll found
    if (!payroll) {
      return {
        totalcurrentMonthPayroll: 0,
        totalEmployeesInRolled: 0,
        averageSalary: 0,
        pendingPayments: 0,
        lastPayrollRun: null,
      };
    }

    const selectedEmployees = payroll.selectedEmployees || [];
    const totalEmployeesInRolled = selectedEmployees.length;

    const totalBasePay = selectedEmployees.reduce((sum, emp) => {
      return sum + (emp.salaryPay?.basePay || 0);
    }, 0);

    const averageSalary = totalEmployeesInRolled > 0
      ? totalBasePay / totalEmployeesInRolled
      : 0;

    const pendingPayments = selectedEmployees.filter(
      emp => emp.status?.toLowerCase() === 'pending'
    ).length;

    const monthyTrend = await this.getMonthlyPayrollTrend(tenantId);
    const salaryDistribution = await this.getSalaryDistribution({ selectedEmployees });
    const getDepartmentWisePayroll = await this.getDepartmentWisePayroll(tenantId, currentMonthName);
    const recentPayrollRuns = await this.getRecentPayrollRuns(tenantId);
    const departmentWiseOvertimeData = await this.getDepartmentWiseOvertimeData(tenantId);

    return {
      payrollSummary: {
      totalcurrentMonthPayroll: payroll.netPay || 0,
      totalEmployeesInRolled,
      averageSalary,
      pendingPayments,
      lastPayrollRun: payroll.createdAt 
        ? new Date(payroll.createdAt).toISOString().split('T')[0]
        : null,
      },
      monthyTrend,
      salaryDistribution,
      getDepartmentWisePayroll,
      recentPayrollRuns,
      departmentWiseOvertimeData
    };
  }

  async getDepartmentWisePayroll(tenantId: string, payrollMonth: string) {
    if (!tenantId || !Types.ObjectId.isValid(tenantId)) {
      throw new HttpException('Invalid tenant ID', HttpStatus.BAD_REQUEST);
    }

    const pipeline: any[] = [
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          ...(payrollMonth && { payrollMonth })
        }
      },
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
          from: "departments",
          localField: "employee.departmentId",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          basePay: { $ifNull: ["$selectedEmployees.salaryPay.basePay", 0] },
          totalAdditions: {
            $sum: {
              $map: {
                input: { $ifNull: ["$selectedEmployees.salaryPay.additions", []] },
                as: "add",
                in: { $ifNull: ["$$add.amount", 0] }
              }
            }
          },
          totalDeductions: {
            $sum: {
              $map: {
                input: { $ifNull: ["$selectedEmployees.salaryPay.deductions", []] },
                as: "ded",
                in: { $ifNull: ["$$ded.amount", 0] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          employeeTotalPay: {
            $subtract: [
              { $add: ["$basePay", "$totalAdditions"] },
              "$totalDeductions"
            ]
          }
        }
      },
      {
        $group: {
          _id: "$department.departmentName",
          employees: { $sum: 1 },
          totalBasePay: { $sum: "$basePay" },
          totalPayroll: { $sum: "$employeeTotalPay" }
        }
      },
      {
        $addFields: {
          avgSalary: {
            $cond: [
              { $gt: ["$employees", 0] },
              { $divide: ["$totalBasePay", "$employees"] },
              0
            ]
          }
        }
      },
      {
        $project: {
          department: "$_id",
          employees: 1,
          totalPayroll: 1,
          avgSalary: 1,
          _id: 0
        }
      }
    ];

    return await this.payrollModel.aggregate(pipeline).exec();
  }

  async getMonthlyPayrollTrend(tenantId: string) {
    if (!tenantId || !Types.ObjectId.isValid(tenantId)) {
      throw new HttpException('Invalid tenant ID', HttpStatus.BAD_REQUEST);
    }

    const monthsArray = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];

    const pipeline: any[] = [
      { $match: { tenantId: new Types.ObjectId(tenantId) } },
      {
        $addFields: {
          parts: { $split: [{ $ifNull: ["$payrollMonth", ""] }, " "] }
        }
      },
      {
        $addFields: {
          monthName: {
            $ifNull: [{ $trim: { input: { $arrayElemAt: ["$parts", 0] } } }, ""]
          },
          yearStr: {
            $ifNull: [{ $trim: { input: { $arrayElemAt: ["$parts", 1] } } }, "0"]
          }
        }
      },
      {
        $group: {
          _id: "$payrollMonth",
          payroll: { $sum: "$netPay" },
          employees: {
            $sum: {
              $size: { $ifNull: ["$selectedEmployees", []] }
            }
          },
          monthName: { $first: "$monthName" },
          yearStr: { $first: "$yearStr" }
        }
      },
      {
        $addFields: {
          monthIndex: {
            $indexOfArray: [
              monthsArray,
              {
                $concat: [
                  { $toUpper: { $substrCP: ["$monthName", 0, 1] } },
                  { $toLower: { $substrCP: ["$monthName", 1, { $strLenCP: { $ifNull: ["$monthName", ""] } }] } }
                ]
              }
            ]
          }
        }
      },
      {
        $addFields: {
          monthNum: { $add: ["$monthIndex", 1] },
          year: { $toInt: "$yearStr" },
          monthShort: {
            $substrCP: [
              {
                $concat: [
                  { $toUpper: { $substrCP: ["$monthName", 0, 1] } },
                  { $toLower: { $substrCP: ["$monthName", 1, { $strLenCP: { $ifNull: ["$monthName", ""] } }] } }
                ]
              },
              0,
              3
            ]
          }
        }
      },

      { $sort: { year: 1, monthNum: 1 } },
      { $project: { _id: 0, month: "$monthShort", payroll: 1, employees: 1 } }
    ];

    const result = await this.payrollModel.aggregate(pipeline).exec();

    console.log("📅 Monthly Payroll Trend Debug");
    result.forEach((item, i) => {
      console.log(`${i + 1}: Month = ${item.month}, Payroll = ${item.payroll}, Employees = ${item.employees}`);
    });

    return result;
  }

  async getSalaryDistribution(payrollData: { selectedEmployees?: any[] }) {
    const getRandomColor = (): string =>
      "#" + Math.floor(Math.random() * 16777215).toString(16);
    const ranges = [
      { min: 10000, max: 20000 },
      { min: 20000, max: 30000 },
      { min: 30000, max: 40000 },
      { min: 40000, max: 50000 },
      { min: 50000, max: 60000 },
      { min: 60000, max: 70000 },
      { min: 80000, max: Infinity }
    ];

    const salaryDistribution = ranges.map(range => ({
      range:
        range.max === Infinity
          ? `${range.min}+`
          : `${range.min}-${range.max}`,
      count: 0,
      color: getRandomColor()
    }));

    if (!payrollData?.selectedEmployees) return salaryDistribution;

    payrollData.selectedEmployees.forEach((emp: any) => {
      const basePay: number = emp.salaryPay?.basePay || 0;

      const totalAdditions: number =
        (emp.additions?.reduce((sum: number, a: any) => sum + (a.amount || 0), 0)) || 0;

      const totalDeductions: number =
        (emp.deductions?.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)) || 0;

      const finalSalary: number = basePay + totalAdditions - totalDeductions;

      const rangeObj = salaryDistribution.find(r => {
        const [minStr, maxStr] = r.range.split("-");
        const min = parseInt(minStr);
        const max = maxStr?.includes("+") ? Infinity : parseInt(maxStr);
        return finalSalary >= min && finalSalary <= max;
      });

      if (rangeObj) {
        rangeObj.count += 1;
      }
    });

    return salaryDistribution;
  }

  async getRecentPayrollRuns(tenantId: string) {
    if (!tenantId || !Types.ObjectId.isValid(tenantId)) {
      throw new HttpException('Invalid tenant ID', HttpStatus.BAD_REQUEST);
    }

    const payrolls = await this.payrollModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    return payrolls.map(p => {
      const employeesCount = p.selectedEmployees?.length || 0;
      const totalNetPay = p.netPay || 0;

      return {
        payrollMonth: p.payrollMonth || null,
        employees: employeesCount,
        amount: totalNetPay,
        status: p.status || null
      };
    });
  }

  async getDepartmentWiseOvertimeData(tenantId: string) {
    if (!tenantId || !Types.ObjectId.isValid(tenantId)) {
      throw new HttpException('Invalid tenant ID', HttpStatus.BAD_REQUEST);
    }

    const pipeline: any[] = [
      {
        $match: {
          type: "overtime",
          "workflow.status": "approved"
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $match: {
          "employee.tenantId": new Types.ObjectId(tenantId)
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "employee.departmentId",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$department.departmentName",
          overtimeHours: { $sum: { $ifNull: ["$overtimeDetails.totalHour", 0] } },
          employeesSet: { $addToSet: "$employee._id" }
        }
      },
      {
        $addFields: {
          employeesCount: { $size: "$employeesSet" },
          regularHours: { $multiply: [{ $size: "$employeesSet" }, 208] }
        }
      },
      {
        $project: {
          department: "$_id",
          regularHours: 1,
          overtimeHours: 1,
          _id: 0
        }
      }
    ];

    return await this.RequestMangmentModel.aggregate(pipeline).exec();
  }
}