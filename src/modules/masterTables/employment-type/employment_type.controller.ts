import { Controller, Post, Get, Body, Param, Logger, Query, Patch, Delete } from '@nestjs/common';
import { EmploymentTypeService } from './employment_type.service';
import { CreateEmploymentTypeDto } from './dto/create-employment-type.dto';
import { GetEmploymentTypeDto } from './dto/get-employment-type.dto copy';
import { UpdateEmploymentTypeDto } from './dto/update-employment-type.dto';

@Controller('employment-type')
export class EmploymentTypeController {
  private readonly logger = new Logger(EmploymentTypeController.name);

  constructor(private readonly service: EmploymentTypeService) {}

  @Post()
  async create(@Body() dto: CreateEmploymentTypeDto) {
    this.logger.log('Creating employment-type');
    return this.service.create(dto);
  }

 @Get()
   async findAll(@Query() query: GetEmploymentTypeDto) {
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
        @Body() updateDto: UpdateEmploymentTypeDto,
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
