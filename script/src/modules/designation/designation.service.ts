import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Designation } from './schemas/designation.schema';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { plainToClass } from 'class-transformer';
import { GetDesignationDto } from './dto/get-designation.dto';

@Injectable()
export class DesignationService {
  private readonly logger = new Logger(DesignationService.name);

  constructor(@InjectModel(Designation.name) private readonly model: Model<Designation>) {}

  async create(dto: CreateDesignationDto): Promise<GetDesignationDto> {
    try {
      const doc = await this.model.create(dto);
      return plainToClass(GetDesignationDto, doc.toObject());
    } catch (err) {
      this.logger.error('Create failed', err.stack);
      throw new HttpException('Create failed', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(): Promise<GetDesignationDto[]> {
    const docs = await this.model.find({ isActive: true });
    return docs.map(d => plainToClass(GetDesignationDto, d.toObject()));
  }

  async findOne(id: string): Promise<GetDesignationDto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.model.findById(id);
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(GetDesignationDto, doc.toObject());
  }

  async update(id: string, dto: UpdateDesignationDto): Promise<GetDesignationDto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const updated = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(GetDesignationDto, updated.toObject());
  }

  async remove(id: string): Promise<GetDesignationDto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(GetDesignationDto, doc.toObject());
  }

  async getDropdown(): Promise<{ label: string; value: string }[]> {
    const docs = await this.findAll();
    return docs.map(d => ({ label: d.title, value: d._id }));
  }
}
