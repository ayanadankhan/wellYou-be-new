import { Controller, Post, Get, Body, Param, Logger, Query, Patch, Delete } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { GetDepartmentQueryDto } from './dto/get-department-query.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments')
export class DepartmentController {
  private readonly logger = new Logger(DepartmentController.name);

  constructor(private readonly service: DepartmentService) { }

  @Post()
  async create(@Body() dto: CreateDepartmentDto) {
    this.logger.log('Creating department');
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query() query: GetDepartmentQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('/dropdown/options')
  async dropdown() {
    return this.service.getDropdown();
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDepartmentDto,
  ) {
    this.logger.log(`Updating department with id: ${id}`);
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    this.logger.warn(`Deleting department with id: ${id}`);
    return this.service.delete(id);
  }
}
