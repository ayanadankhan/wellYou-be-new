import { Controller, Get, Post, Body, Param, Delete, Patch, Query } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';

@Controller('salary')
export class SalaryController {
  constructor(private readonly service: SalaryService) {}

  @Post()
  create(@Body() dto: CreateSalaryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('employeeName') employeeName?: string) {
    return this.service.findAll({ employeeName });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSalaryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
