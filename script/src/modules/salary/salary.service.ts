import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Salary } from './schemas/salary.schema';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { plainToClass } from 'class-transformer';
import { GetSalaryDto } from './dto/get-salary.dto';

@Injectable()
export class SalaryService {
  private readonly logger = new Logger(SalaryService.name);

  constructor(@InjectModel(Salary.name) private readonly model: Model<Salary>) {}

  async create(dto: CreateSalaryDto): Promise<GetSalaryDto> {
    try {
      const doc = await this.model.create(dto);
      return plainToClass(GetSalaryDto, doc.toObject());
    } catch (error) {
      this.logger.error('Create error', error.stack);
      throw new HttpException('Failed to create', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(filter: { employeeName?: string }): Promise<GetSalaryDto[]> {
    const query: any = {};
    if (filter.employeeName) {
      query.employeeName = { $regex: filter.employeeName, $options: 'i' };
    }
    const docs = await this.model.find(query);
    return docs.map(d => plainToClass(GetSalaryDto, d.toObject()));
  }

  async findOne(id: string): Promise<GetSalaryDto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.model.findById(id);
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(GetSalaryDto, doc.toObject());
  }

  async update(id: string, dto: UpdateSalaryDto): Promise<GetSalaryDto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(GetSalaryDto, doc.toObject());
  }

  async remove(id: string): Promise<GetSalaryDto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(GetSalaryDto, doc.toObject());
  }
}
