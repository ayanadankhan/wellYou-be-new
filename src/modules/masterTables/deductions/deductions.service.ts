import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deduction, DeductionSchema } from './entities/deduction.entity';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { UpdateDeductionDto } from './dto/update-deduction.dto';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class DeductionsService {
  private readonly logger = new Logger(DeductionsService.name);

  constructor(
    @InjectModel(Deduction.name) private readonly deductionModel: Model<Deduction>,
  ) {}

  async create(createDeductionDto: CreateDeductionDto): Promise<Deduction> {
    try {
      this.logger.log(`Creating deduction with title: ${createDeductionDto.title}`);
      const deduction = new this.deductionModel(createDeductionDto);
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

  async findAll(query: { title?: string; isDefault?: boolean } = {}): Promise<Deduction[]> {
    try {
      this.logger.log(`Fetching deductions with query: ${JSON.stringify(query)}`);
      const filter: any = {};
      if (query.title) {
        filter.title = { $regex: query.title, $options: 'i' };
      }
      if (query.isDefault !== undefined) {
        filter.isDefault = query.isDefault;
      }
      const deductions = await this.deductionModel.find(filter).exec();
      this.logger.log(`Retrieved ${deductions.length} deductions`);
      return deductions;
    } catch (error) {
      this.logger.error(`Failed to fetch deductions: ${error.message}`, error.stack);
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