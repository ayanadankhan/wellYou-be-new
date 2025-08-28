import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Designation } from './schemas/designation.schema';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { plainToClass } from 'class-transformer';
import { GetDesignationDto } from './dto/get-designation.dto';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';

@Injectable()
export class DesignationService {
  private readonly logger = new Logger(DesignationService.name);

  constructor(@InjectModel(Designation.name) private readonly designationModel: Model<Designation>) {}

  async create(dto: CreateDesignationDto , user: AuthenticatedUser): Promise<GetDesignationDto> {
    try {
      const doc = await this.designationModel.create({
        ...dto,
        tenantId: new Types.ObjectId(user.tenantId),
      });
      return plainToClass(GetDesignationDto, doc.toObject());
    } catch (err) {
      this.logger.error('Create failed', err.stack);
      throw new HttpException('Create failed', HttpStatus.BAD_REQUEST);
    }
  }

  // async findAll(): Promise<GetDesignationDto[]> {
  //   const docs = await this.designationModel.find({ isActive: true });
  //   return docs.map(d => plainToClass(GetDesignationDto, d.toObject()));
  // }

  async findAll(getDto: GetDesignationDto, user: AuthenticatedUser) {
    try {
      const pipeline: any[] = [];

      if (user?.tenantId) {
        pipeline.push({ $match: { tenantId: new Types.ObjectId(user.tenantId) } });
      }

      if (getDto.title) {
        pipeline.push({ $match: { title: new RegExp(getDto.title, 'i') } });
      }
      const isActive =
        typeof getDto.isActive === 'string'
          ? getDto.isActive === 'true'
          : getDto.isActive;

        if (isActive !== undefined) {
          pipeline.push({ $match: { isActive } });
        }
      const [list, countQuery] = await Promise.all([
        this.designationModel.aggregate([
          ...pipeline,
          { $sort: { [getDto.sb || 'createdAt']: getDto.sd === '1' ? 1 : -1 } },
          { $skip: Number(getDto.o || 0) },
          { $limit: Number(getDto.l || 10) },
        ]).exec(),

        this.designationModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);

      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch designations',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  async findOne(id: string): Promise<GetDesignationDto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.designationModel.findById(id);
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(GetDesignationDto, doc.toObject());
  }

  async update(id: string, dto: UpdateDesignationDto): Promise<GetDesignationDto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const updated = await this.designationModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(GetDesignationDto, updated.toObject());
  }

  async remove(id: string): Promise<GetDesignationDto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.designationModel.findByIdAndDelete(id);
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(GetDesignationDto, doc.toObject());
  }

  // async getDropdown(): Promise<{ label: string; value: string }[]> {
  //   const docs = await this.findAll();
  //   return docs.map(d => ({ label: d.title, value: d._id }));
  // }
}
