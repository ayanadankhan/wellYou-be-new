import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { User } from '../tenant/users/schemas/user.schema';

@ApiTags('Salary')
@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() createSalaryDto: CreateSalaryDto) {
    return this.salaryService.create(createSalaryDto, user);
  }

  @Get()
    async findAll(@CurrentUser() user: User) {
      return this.salaryService.findAll(user);
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.salaryService.findByEmployee(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salaryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSalaryDto: UpdateSalaryDto, @CurrentUser() user: any,) {
    return this.salaryService.update(id, updateSalaryDto, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.salaryService.remove(id, user);
  }
}