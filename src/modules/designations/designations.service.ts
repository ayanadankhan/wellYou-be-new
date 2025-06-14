import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { Designation } from './entities/designation.entity';

@Injectable()
export class DesignationsService {
  constructor(
    @InjectModel(Designation.name) private readonly designationModel: Model<Designation>,
  ) {}

  async create(createDesignationDto: CreateDesignationDto): Promise<Designation> {
    const createdDesignation = new this.designationModel({
      isActive: true,
      ...createDesignationDto
    });
    return createdDesignation.save();
  }

  async findAll(): Promise<Designation[]> {
    return this.designationModel.find().exec();
  }

  async findOne(id: string): Promise<Designation> {
    const designation = await this.designationModel.findById(id).exec();
    if (!designation) {
      throw new NotFoundException(`Designation with ID ${id} not found`);
    }
    return designation;
  }

  async update(id: string, updateDesignationDto: UpdateDesignationDto): Promise<Designation> {
    const updatedDesignation = await this.designationModel
      .findByIdAndUpdate(id, updateDesignationDto, { new: true })
      .exec();
      
    if (!updatedDesignation) {
      throw new NotFoundException(`Designation with ID ${id} not found`);
    }
    return updatedDesignation;
  }

  async remove(id: string): Promise<Designation> {
    const deletedDesignation = await this.designationModel.findByIdAndDelete(id).exec();
    if (!deletedDesignation) {
      throw new NotFoundException(`Designation with ID ${id} not found`);
    }
    return deletedDesignation;
  }

  async toggleStatus(id: string): Promise<Designation> {
    const designation = await this.designationModel.findById(id).exec();
    if (!designation) {
      throw new NotFoundException(`Designation with ID ${id} not found`);
    }
    designation.isActive = !designation.isActive;
    return designation.save();
  }
}