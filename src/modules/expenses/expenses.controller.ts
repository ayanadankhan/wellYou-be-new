import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpStatus,
  HttpException,
  Query,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { GetExpenseDto } from './dto/get-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() createExpenseDto: CreateExpenseDto) {
  if (!user) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    return this.expensesService.create(createExpenseDto , user);
  }


  @Get()
  findAll(@Query() getDto: GetExpenseDto , @CurrentUser() user : AuthenticatedUser) {
    return this.expensesService.findAll(getDto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}