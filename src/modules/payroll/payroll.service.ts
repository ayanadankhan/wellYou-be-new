import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
      payrollMonth: createPayrollDto.payrollMonth
    }).exec();

    if (existingPayroll) {
      throw new ConflictException(`Payroll for month ${createPayrollDto.payrollMonth} already exists`);
    }

    try {
      const createdPayroll = new this.payrollModel(createPayrollDto);
      return await createdPayroll.save();
    } catch (error) {
      if (error.code === 11000) { // MongoDB duplicate key error
        throw new ConflictException(`Payroll for month ${createPayrollDto.payrollMonth} already exists`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Payroll[]> {
    return this.payrollModel.find().sort({ payrollMonth: -1 }).exec(); // Sort by month descending
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
    // If payrollMonth is being updated, check for duplicates
    if (updatePayrollDto.payrollMonth) {
      const existingPayroll = await this.payrollModel.findOne({
        payrollMonth: updatePayrollDto.payrollMonth,
        _id: { $ne: id } // Exclude current record from check
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
}