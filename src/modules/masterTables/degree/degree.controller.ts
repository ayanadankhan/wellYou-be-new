import { Controller, Post, Get, Body, Param, Logger, Patch, Delete, Query } from '@nestjs/common';
import { DegreeService } from './degree.service';
import { CreateDegreeDto } from './dto/create-degree.dto';
import { UpdateDegreeDto } from './dto/update-degree.dto';
import { GetDegreeQueryDto } from './dto/get-degree-query.dto';

@Controller('degree')
export class DegreeController {
  private readonly logger = new Logger(DegreeController.name);

  constructor(private readonly service: DegreeService) {}

  @Post()
  async create(@Body() dto: CreateDegreeDto) {
    this.logger.log('Creating degree');
    return this.service.create(dto);
  }

  @Get()
   async findAll(@Query() query: GetDegreeQueryDto) {
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
      @Body() updateDto: UpdateDegreeDto,
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
