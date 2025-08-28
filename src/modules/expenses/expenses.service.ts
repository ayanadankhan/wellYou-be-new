import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { GetExpenseDto } from './dto/get-expense.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto ,user: AuthenticatedUser): Promise<Expense> {
    const createdExpense = new this.expenseModel({
      ...createExpenseDto,
      tenantId: new Types.ObjectId(user.tenantId),
    });
    return createdExpense.save();
  }

  async findAll(getDto: GetExpenseDto, user: AuthenticatedUser) {
    try {
      const pipeline: any[] = [];

      if (user?.tenantId) {
        pipeline.push({ $match: { tenantId: new Types.ObjectId(user.tenantId) } });
      }

      if (getDto.general) {
        pipeline.push({ $match: { general: new RegExp(getDto.general, 'i') } });
      }

      const isActive =
      typeof getDto.isActive === 'string'
        ? getDto.isActive === 'true'
        : getDto.isActive;

      if (isActive !== undefined) {
        pipeline.push({ $match: { isActive } });
      }
      const [list, countQuery] = await Promise.all([
        this.expenseModel.aggregate([
          ...pipeline,
          { $sort: { [getDto.sb || 'createdAt']: getDto.sd === '1' ? 1 : -1 } },
          { $skip: Number(getDto.o || 0) },
          { $limit: Number(getDto.l || 10) },
        ]).exec(),

        this.expenseModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
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

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseModel.findById(id).exec();
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto): Promise<Expense> {
    const existingExpense = await this.expenseModel
      .findByIdAndUpdate(id, updateExpenseDto, { new: true })
      .exec();
    
    if (!existingExpense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return existingExpense;
  }

  async remove(id: string): Promise<Expense> {
    const deletedExpense = await this.expenseModel.findByIdAndDelete(id).exec();
    if (!deletedExpense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return deletedExpense;
  }
}