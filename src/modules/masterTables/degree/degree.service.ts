import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Degree } from './schemas/degree.schema';
import { CreateDegreeDto } from './dto/create-degree.dto';
import { UpdateDegreeDto } from './dto/update-degree.dto';

@Injectable()
export class DegreeService {
  private readonly logger = new Logger(DegreeService.name);

  constructor(
    @InjectModel(Degree.name)
    private readonly model: Model<Degree>,
  ) { }

  async create(dto: CreateDegreeDto) {
    try {
      return await this.model.create(dto);
    } catch (err) {
      this.logger.error('Create failed', err.stack);
      throw new InternalServerErrorException('Failed to create degree');
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
    if (!doc) throw new NotFoundException('Degree not found');
    return doc;
  }

  async getDropdown() {
    const docs = await this.findAll();
    return docs.map(d => ({ label: d.title, value: d._id }));
  }

  async update(id: string, updateDto: UpdateDegreeDto) {
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
