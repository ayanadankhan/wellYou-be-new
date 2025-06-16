import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { Payroll } from './entities/payroll.entity';

@Injectable()
export class PayrollService {
  constructor(
    @InjectModel(Payroll.name) private readonly payrollModel: Model<Payroll>,
  ) {}

  async create(createPayrollDto: CreatePayrollDto): Promise<Payroll> {
    const createdPayroll = new this.payrollModel(createPayrollDto);
    return createdPayroll.save();
  }

  async findAll(): Promise<Payroll[]> {
    return this.payrollModel.find().exec();
  }

  async findOne(id: string): Promise<Payroll> {
    const payroll = await this.payrollModel.findById(id).exec();
    if (!payroll) {
      throw new NotFoundException(`Payroll with ID ${id} not found`);
    }
    return payroll;
  }

  async update(id: string, updatePayrollDto: UpdatePayrollDto): Promise<Payroll> {
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
}