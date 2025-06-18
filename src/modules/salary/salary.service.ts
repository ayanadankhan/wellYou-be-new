import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { Salary } from './entities/salary.entity';

@Injectable()
export class SalaryService {
  constructor(
    @InjectModel(Salary.name) private readonly salaryModel: Model<Salary>,
    
  ) {}

  async create(createSalaryDto: CreateSalaryDto): Promise<Salary> {   
    const createdSalary = new this.salaryModel(createSalaryDto);
    return createdSalary.save();
  }

  async findAll(): Promise<Salary[]> {
    return this.salaryModel.aggregate([
      // Step 1: Lookup employee
      {
        $lookup: {
          from: 'employees',
          localField: 'employeesId',
          foreignField: '_id',
          as: 'employeesId'
        }
      },
      { $unwind: { path: '$employeesId', preserveNullAndEmptyArrays: true } },

      // Step 2: Populate userId inside employees
      {
        $lookup: {
          from: 'users',
          localField: 'employeesId.userId',
          foreignField: '_id',
          as: 'employeesId.userId'
        }
      },
      { $unwind: { path: '$employeesId.userId', preserveNullAndEmptyArrays: true } },

      // Step 3: Populate departmentId inside employees
      {
        $lookup: {
          from: 'departments',
          localField: 'employeesId.departmentId',
          foreignField: '_id',
          as: 'employeesId.departmentId'
        }
      },
      { $unwind: { path: '$employeesId.departmentId', preserveNullAndEmptyArrays: true } },

      // Step 4: Populate positionId inside employees
      {
        $lookup: {
          from: 'designations',
          localField: 'employeesId.positionId',
          foreignField: '_id',
          as: 'employeesId.positionId'
        }
      },
      { $unwind: { path: '$employeesId.positionId', preserveNullAndEmptyArrays: true } }
    ]).exec();
  }

  async findOne(id: string): Promise<Salary> {
    const salary = await this.salaryModel.findById(id).exec();
    if (!salary) {
      throw new NotFoundException(`Salary with ID ${id} not found`);
    }
    return salary;
  }

  async update(id: string, updateSalaryDto: UpdateSalaryDto): Promise<Salary> {
    const updatedSalary = await this.salaryModel
      .findByIdAndUpdate(id, updateSalaryDto, { new: true })
      .exec();
      
    if (!updatedSalary) {
      throw new NotFoundException(`Salary with ID ${id} not found`);
    }
    return updatedSalary;
  }

  async remove(id: string): Promise<Salary> {
    const deletedSalary = await this.salaryModel.findByIdAndDelete(id).exec();
    if (!deletedSalary) {
      throw new NotFoundException(`Salary with ID ${id} not found`);
    }
    return deletedSalary;
  }

  async findByEmployee(employeeId: string): Promise<Salary[]> {
    return this.salaryModel.find({ employeesId: employeeId }).exec();
  }
}