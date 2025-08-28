import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { Currency } from './entities/currency.entity';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';
import { GetCurrencyDto } from './dto/get-currency.dto';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectModel(Currency.name) private currencyModel: Model<Currency>,
  ) {}

  async create(createCurrencyDto: CreateCurrencyDto , user: AuthenticatedUser): Promise<Currency> {
    const createdCurrency = new this.currencyModel({
     ...createCurrencyDto,
     tenantId: new Types.ObjectId(user.tenantId),
    });
    return createdCurrency.save();
  }

  // async findAll(): Promise<Currency[]> {
  //   return this.currencyModel.find().exec();
  // }

  async findAll(getDto: GetCurrencyDto, user: AuthenticatedUser) {
    try {
      const pipeline: any[] = [];
  
      if (user?.tenantId) {
        pipeline.push({ $match: { tenantId: new Types.ObjectId(user.tenantId) } });
      }
  
      if (getDto.name) {
        pipeline.push({ $match: { name: new RegExp(getDto.name, 'i') } });
      }
  
      const isActive =
      typeof getDto.isActive === 'string'
        ? getDto.isActive === 'true'
        : getDto.isActive;
  
      if (isActive !== undefined) {
        pipeline.push({ $match: { isActive } });
      }
      const [list, countQuery] = await Promise.all([
        this.currencyModel.aggregate([
          ...pipeline,
          { $sort: { [getDto.sb || 'createdAt']: getDto.sd === '1' ? 1 : -1 } },
          { $skip: Number(getDto.o || 0) },
          { $limit: Number(getDto.l || 10) },
        ]).exec(),
  
        this.currencyModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);
  
      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch additions',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<Currency> {
    const currency = await this.currencyModel.findById(id).exec();
    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
    return currency;
  }

  async update(id: string, updateCurrencyDto: UpdateCurrencyDto): Promise<Currency> {
    const updatedCurrency = await this.currencyModel
      .findByIdAndUpdate(id, updateCurrencyDto, { new: true })
      .exec();
    if (!updatedCurrency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
    return updatedCurrency;
  }

  async remove(id: string): Promise<void> {
    const result = await this.currencyModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
  }
}