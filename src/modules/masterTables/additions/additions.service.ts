import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Addition, AdditionSchema } from './entities/addition.entity';
import { CreateAdditionDto } from './dto/create-addition.dto';
import { UpdateAdditionDto } from './dto/update-addition.dto';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class AdditionsService {
  private readonly logger = new Logger(AdditionsService.name);

  constructor(
    @InjectModel(Addition.name) private readonly additionModel: Model<Addition>,
  ) {}

  async create(createAdditionDto: CreateAdditionDto): Promise<Addition> {
    try {
      this.logger.log(`Creating addition with title: ${createAdditionDto.title}`);
      const addition = new this.additionModel(createAdditionDto);
      const savedAddition = await addition.save();
      this.logger.log(`Addition created successfully with ID: ${savedAddition._id}`);
      return savedAddition;
    } catch (error) {
      this.logger.error(`Failed to create addition: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to create addition',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(query: { title?: string; isDefault?: boolean } = {}): Promise<Addition[]> {
    try {
      this.logger.log(`Fetching additions with query: ${JSON.stringify(query)}`);
      const filter: any = {};
      if (query.title) {
        filter.title = { $regex: query.title, $options: 'i' }; // Case-insensitive partial match
      }
      if (query.isDefault !== undefined) {
        filter.isDefault = query.isDefault;
      }
      const additions = await this.additionModel.find(filter).exec();
      this.logger.log(`Retrieved ${additions.length} additions`);
      return additions;
    } catch (error) {
      this.logger.error(`Failed to fetch additions: ${error.message}`, error.stack);
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

  async findOne(id: string): Promise<Addition> {
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
      this.logger.log(`Fetching addition with ID: ${id}`);
      const addition = await this.additionModel.findById(id).exec();
      if (!addition) {
        this.logger.warn(`Addition with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Addition not found',
            message: `Addition with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Addition with ID ${id} retrieved successfully`);
      return addition;
    } catch (error) {
      this.logger.error(`Failed to fetch addition with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch addition',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateAdditionDto: UpdateAdditionDto): Promise<Addition> {
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
      this.logger.log(`Updating addition with ID: ${id}`);
      const updatedAddition = await this.additionModel
        .findByIdAndUpdate(id, { $set: updateAdditionDto }, { new: true })
        .exec();
      if (!updatedAddition) {
        this.logger.warn(`Addition with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Addition not found',
            message: `Addition with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Addition with ID ${id} updated successfully`);
      return updatedAddition;
    } catch (error) {
      this.logger.error(`Failed to update addition with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to update addition',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async remove(id: string): Promise<Addition> {
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
      this.logger.log(`Deleting addition with ID: ${id}`);
      const deletedAddition = await this.additionModel.findByIdAndDelete(id).exec();
      if (!deletedAddition) {
        this.logger.warn(`Addition with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Addition not found',
            message: `Addition with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Addition with ID ${id} deleted successfully`);
      return deletedAddition;
    } catch (error) {
      this.logger.error(`Failed to delete addition with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to delete addition',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}