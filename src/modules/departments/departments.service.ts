import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateDepartmentDto } from './dto/create-Department-dto';
import { UpdateDepartmentDto } from './dto/update-Department-dto';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name) private readonly departmentModel: Model<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const createdDepartment = new this.departmentModel({
      isActive: true,
      ...createDepartmentDto,
      parentDepartmentId: createDepartmentDto.parentDepartmentId 
        ? new Types.ObjectId(createDepartmentDto.parentDepartmentId) 
        : null,
      departmentHeadId: createDepartmentDto.departmentHeadId
        ? new Types.ObjectId(createDepartmentDto.departmentHeadId)
        : null
    });
    return createdDepartment.save();
  }

  async findAll(): Promise<Department[]> {
    return this.departmentModel.find().exec();
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentModel.findById(id)
      .exec();
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    const updateData: any = { ...updateDepartmentDto };
    
    if (updateDepartmentDto.parentDepartmentId) {
      updateData.parentDepartmentId = new Types.ObjectId(updateDepartmentDto.parentDepartmentId);
    }
    
    if (updateDepartmentDto.departmentHeadId) {
      updateData.departmentHeadId = new Types.ObjectId(updateDepartmentDto.departmentHeadId);
    }

    const updatedDepartment = await this.departmentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
      
    if (!updatedDepartment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return updatedDepartment;
  }

  async remove(id: string): Promise<Department> {
    const deletedDepartment = await this.departmentModel.findByIdAndDelete(id).exec();
    if (!deletedDepartment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return deletedDepartment;
  }

  // async findByCode(departmentCode: string): Promise<Department> {
  //   return this.departmentModel.findOne({ departmentCode }).exec();
  // }

  async getSubDepartments(parentId: string): Promise<Department[]> {
    return this.departmentModel.find({ parentDepartmentId: parentId }).exec();
  }
}