import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmploymentType } from './schemas/employment_type.schema';
import { CreateEmploymentTypeDto } from './dto/create-employment-type.dto';
import { UpdateEmploymentTypeDto } from './dto/update-employment-type.dto';

@Injectable()
export class EmploymentTypeService {
  private readonly logger = new Logger(EmploymentTypeService.name);

  constructor(
    @InjectModel(EmploymentType.name)
    private readonly model: Model<EmploymentType>,
  ) {}

  async create(dto: CreateEmploymentTypeDto) {
    try {
      return await this.model.create(dto);
    } catch (err) {
      this.logger.error('Create failed', err.stack);
      throw new InternalServerErrorException('Failed to create employment-type');
    }
  }

async findAll(filters: { title?: string; isActive?: boolean } = {}) {
    console.log(filters, 'filters in findAll');

    const query: any = {};

    if (filters.title) {
      query.title = { $regex: filters.title, $options: 'i' };
    }

    if (typeof filters.isActive === 'boolean') {
      query.isActive = filters.isActive;
    }

    return this.model.find(query).exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('EmploymentType not found');
    return doc;
  }

  async getDropdown() {
    const docs = await this.findAll();
    return docs.map(d => ({ label: d.title, value: d._id }));
  }

  async update(id: string, updateDto: UpdateEmploymentTypeDto) {
      const updated = await this.model.findByIdAndUpdate(id, updateDto, {
        new: true,
        runValidators: true,
      }).exec();
  
      if (!updated) throw new NotFoundException('Department not found');
      return updated;
    }
  
    async delete(id: string) {
      const result = await this.model.findByIdAndDelete(id).exec();
      if (!result) throw new NotFoundException('Department not found');
      return { message: 'Department deleted successfully', id };
    }
}
