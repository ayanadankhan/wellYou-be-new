import { Injectable, HttpException, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Deduction, DeductionSchema } from './entities/deduction.entity';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { UpdateDeductionDto } from './dto/update-deduction.dto';
import { isValidObjectId } from 'mongoose';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';
import { GetDeductionDto } from './dto/get-deduction.dto';

@Injectable()
export class DeductionsService {
  private readonly logger = new Logger(DeductionsService.name);

  constructor(
    @InjectModel(Deduction.name) private readonly deductionModel: Model<Deduction>,
  ) {}

  async create(createDeductionDto: CreateDeductionDto , user: AuthenticatedUser): Promise<Deduction> {
    try {
      this.logger.log(`Creating deduction with title: ${createDeductionDto.title}`);
      const deduction = new this.deductionModel({
        ...createDeductionDto,
       tenantId: new Types.ObjectId(user.tenantId),
      });
      const savedDeduction = await deduction.save();
      this.logger.log(`Deduction created successfully with ID: ${savedDeduction._id}`);
      return savedDeduction;
    } catch (error) {
      this.logger.error(`Failed to create deduction: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to create deduction',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(getDto: GetDeductionDto, user: AuthenticatedUser) {
    try {
      const pipeline: any[] = [];

      if (user?.tenantId) {
        pipeline.push({ $match: { tenantId: new Types.ObjectId(user.tenantId) } });
      }

      if (getDto.title) {
        pipeline.push({ $match: { title: new RegExp(getDto.title, 'i') } });
      }
      const isDefault =
        typeof getDto.isDefault === 'string'
          ? getDto.isDefault === 'true'
          : getDto.isDefault;

        if (isDefault !== undefined) {
          pipeline.push({ $match: { isDefault } });
        }
      const [list, countQuery] = await Promise.all([
        this.deductionModel.aggregate([
          ...pipeline,
          { $sort: { [getDto.sb || 'createdAt']: getDto.sd === '1' ? 1 : -1 } },
          { $skip: Number(getDto.o || 0) },
          { $limit: Number(getDto.l || 10) },
        ]).exec(),

        this.deductionModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);

      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch deductions',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<Deduction> {
    try {
      if (!isValidObjectId(id)) {
        this.logger.warn(`Invalid MongoDB ObjectID: ${id}`);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid ID',
            message: `Provided ID ${id} is not a valid MongoDB ObjectID`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.log(`Fetching deduction with ID: ${id}`);
      const deduction = await this.deductionModel.findById(id).exec();
      if (!deduction) {
        this.logger.warn(`Deduction with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Deduction not found',
            message: `Deduction with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Deduction with ID ${id} retrieved successfully`);
      return deduction;
    } catch (error) {
      this.logger.error(`Failed to fetch deduction with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch deduction',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateDeductionDto: UpdateDeductionDto): Promise<Deduction> {
    try {
      if (!isValidObjectId(id)) {
        this.logger.warn(`Invalid MongoDB ObjectID: ${id}`);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid ID',
            message: `Provided ID ${id} is not a valid MongoDB ObjectID`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.log(`Updating deduction with ID: ${id}`);
      const updatedDeduction = await this.deductionModel
        .findByIdAndUpdate(id, { $set: updateDeductionDto }, { new: true })
        .exec();
      if (!updatedDeduction) {
        this.logger.warn(`Deduction with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Deduction not found',
            message: `Deduction with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Deduction with ID ${id} updated successfully`);
      return updatedDeduction;
    } catch (error) {
      this.logger.error(`Failed to update deduction with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to update deduction',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async remove(id: string): Promise<Deduction> {
    try {
      if (!isValidObjectId(id)) {
        this.logger.warn(`Invalid MongoDB ObjectID: ${id}`);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid ID',
            message: `Provided ID ${id} is not a valid MongoDB ObjectID`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.log(`Deleting deduction with ID: ${id}`);
      const deletedDeduction = await this.deductionModel.findByIdAndDelete(id).exec();
      if (!deletedDeduction) {
        this.logger.warn(`Deduction with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Deduction not found',
            message: `Deduction with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Deduction with ID ${id} deleted successfully`);
      return deletedDeduction;
    } catch (error) {
      this.logger.error(`Failed to delete deduction with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to delete deduction',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}