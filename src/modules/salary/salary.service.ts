import { Injectable, HttpException, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Salary, SalaryComponent, SalaryStructure } from './schemas/salary.schema';
import { CreateSalaryDto, SalaryComponentDto, SalaryIncrementDto } from './dto/create-salary.dto';

@Injectable()
export class SalaryService {
  private readonly logger = new Logger(SalaryService.name);

  constructor(@InjectModel(Salary.name) private readonly salaryModel: Model<Salary>) { }

  /**
   * Create initial salary record for an employee
   */
  async createSalary(dto: CreateSalaryDto): Promise<Salary> {
    try {
      // Check if salary already exists for employee
      const existingSalary = await this.salaryModel.findOne({ employeeId: dto.employeeId });
      if (existingSalary) {
        throw new HttpException('Salary record already exists for this employee', HttpStatus.CONFLICT);
      }

      const currentSalary: SalaryStructure = {
        baseSalary: dto.baseSalary,
        hourlyRate: dto.hourlyRate || 0,
        currency: dto.currency || 'USD',
        payFrequency: dto.payFrequency,
        additions: this.convertSalaryComponents(dto.additions || []),
        deductions: this.convertSalaryComponents(dto.deductions || []),
        paymentMethod: {
          type: dto.paymentMethod?.type || 'bank',
          bankName: dto.paymentMethod?.bankName || '',
          accountNumber: dto.paymentMethod?.accountNumber || '',
          routingNumber: dto.paymentMethod?.routingNumber || '',
          swiftCode: dto.paymentMethod?.swiftCode || ''
        },
        effectiveDate: dto.effectiveDate,
        endDate: new Date('9999-12-31'),
        status: 'active',
        reason: dto.reason || 'Initial salary setup',
        approvedBy: '',
        createdAt: new Date(),
        createdBy: dto.createdBy
      };

      const salary = new this.salaryModel({
        employeeId: dto.employeeId,
        employeeName: dto.employeeName,
        employeeCode: dto.employeeCode,
        department: dto.department,
        position: dto.position,
        currentSalary,
        salaryHistory: [],
        employmentStatus: 'active',
        lastModifiedBy: dto.createdBy
      });

      // Calculate gross and net pay
      await this.calculatePayAmounts(salary);

      const savedSalary = await salary.save();
      this.logger.log(`Salary created for employee: ${dto.employeeName} (${dto.employeeCode})`);

      return savedSalary;

    } catch (error) {
      this.logger.error('Failed to create salary', error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create salary record', HttpStatus.INTERNAL_SERVER_ERROR);
    }


  }
    async incrementSalary(employeeId: string, dto: SalaryIncrementDto): Promise<Salary> {
    try {
      if (!isValidObjectId(employeeId)) {
        throw new HttpException('Invalid employee ID', HttpStatus.BAD_REQUEST);
      }

      const salary = await this.salaryModel.findOne({ employeeId });
      if (!salary) {
        throw new NotFoundException('Salary record not found');
      }

      // Move current salary to history
     // Move current salary to history - properly convert to plain object
const currentSalaryForHistory = {
  baseSalary: salary.currentSalary.baseSalary,
  hourlyRate: salary.currentSalary.hourlyRate,
  currency: salary.currentSalary.currency,
  payFrequency: salary.currentSalary.payFrequency,
  additions: salary.currentSalary.additions,
  deductions: salary.currentSalary.deductions,
  paymentMethod: salary.currentSalary.paymentMethod,
  effectiveDate: salary.currentSalary.effectiveDate,
  endDate: new Date(),
  status: 'inactive',
  reason: salary.currentSalary.reason,
  approvedBy: salary.currentSalary.approvedBy,
  createdAt: salary.currentSalary.createdAt,
  createdBy: salary.currentSalary.createdBy
};

      salary.salaryHistory.push(currentSalaryForHistory);

      // Update current salary
      salary.currentSalary = {
        baseSalary: dto.baseSalary,
        hourlyRate: dto.hourlyRate || salary.currentSalary.hourlyRate,
        currency: dto.currency || salary.currentSalary.currency,
        payFrequency: dto.payFrequency || salary.currentSalary.payFrequency,
        additions: dto.additions ? this.convertSalaryComponents(dto.additions) : salary.currentSalary.additions,
        deductions: dto.deductions ? this.convertSalaryComponents(dto.deductions) : salary.currentSalary.deductions,
        paymentMethod: dto.paymentMethod ? {
          type: dto.paymentMethod.type,
          bankName: dto.paymentMethod.bankName || '',
          accountNumber: dto.paymentMethod.accountNumber || '',
          routingNumber: dto.paymentMethod.routingNumber || '',
          swiftCode: dto.paymentMethod.swiftCode || ''
        } : salary.currentSalary.paymentMethod,
        effectiveDate: dto.effectiveDate,
        endDate: new Date('9999-12-31'),
        status: 'active',
        reason: dto.reason,
        approvedBy: dto.approvedBy,
        createdAt: new Date(),
        createdBy: dto.createdBy
      };

      salary.lastModifiedBy = dto.createdBy;

      // Recalculate pay amounts
      await this.calculatePayAmounts(salary);

      const updatedSalary = await salary.save();

      this.logger.log(`Salary incremented for employee: ${salary.employeeName} (${salary.employeeCode})`);

      return updatedSalary;

    } catch (error) {
      this.logger.error(`Failed to increment salary for employee: ${employeeId}`, error.stack);
      if (error instanceof HttpException || error instanceof NotFoundException) throw error;
      throw new HttpException('Failed to process salary increment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }  async getCurrentSalary(employeeId: string): Promise<Salary> {
    try {
      if (!isValidObjectId(employeeId)) {
        throw new HttpException('Invalid employee ID', HttpStatus.BAD_REQUEST);
      }

      const salary = await this.salaryModel.findOne({ employeeId });
      if (!salary) {
        throw new NotFoundException('Salary record not found');
      }

      return salary;

    } catch (error) {
      this.logger.error(`Failed to get salary for employee: ${employeeId}`, error.stack);
      if (error instanceof HttpException || error instanceof NotFoundException) throw error;
      throw new HttpException('Failed to retrieve salary information', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get complete salary history
   */
  async getSalaryHistory(employeeId: string): Promise<SalaryStructure[]> {
    try {
      const salary = await this.getCurrentSalary(employeeId);
      return [salary.currentSalary, ...salary.salaryHistory].sort(
        (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
      );

    } catch (error) {
      this.logger.error(`Failed to get salary history for employee: ${employeeId}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all employees' current salaries with filtering
   */
  async getAllSalaries(filters: {
    department?: string;
    position?: string;
    employmentStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: Salary[]; total: number; page: number; limit: number }> {
    try {
      const { department, position, employmentStatus, search, page = 1, limit = 10 } = filters;

      const query: any = {};

      if (department) query.department = { $regex: department, $options: 'i' };
      if (position) query.position = { $regex: position, $options: 'i' };
      if (employmentStatus) query.employmentStatus = employmentStatus;
      if (search) {
        query.$or = [
          { employeeName: { $regex: search, $options: 'i' } },
          { employeeCode: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.salaryModel.find(query).skip(skip).limit(limit).sort({ updatedAt: -1 }),
        this.salaryModel.countDocuments(query)
      ]);

      return { data, total, page, limit };

    } catch (error) {
      this.logger.error('Failed to get all salaries', error.stack);
      throw new HttpException('Failed to retrieve salary records', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Calculate gross and net pay amounts
   */
  private async calculatePayAmounts(salary: Salary): Promise<void> {
    const current = salary.currentSalary;

    // Calculate total additions
    const totalAdditions = current.additions.reduce((sum, addition) => sum + addition.amount, 0);

    // Calculate total deductions
    const totalDeductions = current.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);

    // Calculate gross and net pay
    salary.currentGrossPay = current.baseSalary + totalAdditions;
    salary.currentNetPay = salary.currentGrossPay - totalDeductions;
  }

  /**
   * Helper method to convert DTO salary components to schema salary components
   */
  private convertSalaryComponents(components: SalaryComponentDto[]): SalaryComponent[] {
    return components.map(component => ({
      titleId: new Types.ObjectId(component.titleId),
      title: component.title,
      amount: component.amount,
      description: component.description || ''
    }));
  }

  /**
   * Terminate employee salary
   */
  async terminateEmployeeSalary(employeeId: string, terminationDate: Date, reason: string, terminatedBy: string): Promise<Salary> {
    try {
      const salary = await this.getCurrentSalary(employeeId);

      salary.currentSalary.endDate = terminationDate;
      salary.currentSalary.status = 'terminated';
      salary.employmentStatus = 'terminated';
      salary.lastModifiedBy = terminatedBy;

      // Move to history
      salary.salaryHistory.push({ ...salary.currentSalary, reason });

      const updatedSalary = await salary.save();

      this.logger.log(`Employee salary terminated: ${salary.employeeName} (${salary.employeeCode})`);

      return updatedSalary;

    } catch (error) {
      this.logger.error(`Failed to terminate salary for employee: ${employeeId}`, error.stack);
      throw error;
    }
  }
}